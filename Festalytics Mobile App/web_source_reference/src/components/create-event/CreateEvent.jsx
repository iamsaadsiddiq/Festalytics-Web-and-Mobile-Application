import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/firebase';
import { submitCustomerQuotation } from '@/lib/firestore/quotations';
import {
  appendZaydanCallingRow,
  quotationToCallingRow,
} from '@/lib/google/zaydanCallingSheet';
import { getPublicVenueDocId } from '@/lib/publicVenues';

import DashboardHeader from '../DashboardHeader';
import Footer from '../Footer';
import EventStepper from './EventStepper';

import BasicDetails from './steps/BasicDetails';
import VenueSelection from './steps/VenueSelection';
import Vendors from './steps/Vendors';
import Budget from './steps/Budget';
import Review from './steps/Review';

const TOTAL_STEPS = 5;
const ZAYDAN_VENUE_SLUG = 'zaydan-banquet-hall';

const DEFAULT_EVENT_DATA = {
  eventType: '',
  title: '',
  date: '',
  time: '',
  guestCount: '',
  location: '',
  selectedVenueId: null,
  selectedVenueSlug: null,
  selectedVenueName: '',
  selectedVenueLocation: '',
  selectedVenuePrice: '',
  venuePreviewImage: '',
  selectedCateringPackageId: '',
  selectedCateringPackage: null,
  selectedAddons: {
    ac: false,
    generator: false,
    decor: false,
    sound: false,
    security: false,
  },
  budgetBreakdown: [],
  budgetTotal: 0,
  quotationId: null,
};

function normalizeLegacyEvent(existing) {
  if (!existing) return { ...DEFAULT_EVENT_DATA };
  const slug =
    existing.selectedVenueSlug ||
    (existing.selectedVenueId
      ? getPublicVenueDocId({
          hall_id: existing.selectedVenueId,
          hall_name: existing.selectedVenueName,
        })
      : null);
  return {
    ...DEFAULT_EVENT_DATA,
    ...existing,
    selectedVenueSlug: slug,
    selectedAddons: {
      ...DEFAULT_EVENT_DATA.selectedAddons,
      ...(existing.selectedAddons || {}),
    },
  };
}

const CreateEvent = () => {
  const router = useRouter();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState({ ...DEFAULT_EVENT_DATA });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (id) {
      const events = JSON.parse(localStorage.getItem('festalytics_events') || '[]');
      const existingEvent = events.find((e) => e.id.toString() === id);
      if (existingEvent) {
        setEventData(normalizeLegacyEvent(existingEvent));
      }
    }
  }, [id]);

  const updateFormData = (field, value) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return Boolean(eventData.title?.trim());
    if (step === 2) return Boolean(eventData.selectedVenueSlug);
    if (step === 3) {
      return Boolean(
        eventData.selectedCateringPackageId ||
          eventData.selectedCateringPackage?.id
      );
    }
    return true;
  };

  const saveToLocalStorage = (extra = {}) => {
    const events = JSON.parse(localStorage.getItem('festalytics_events') || '[]');
    const payload = { ...eventData, ...extra };

    if (id) {
      const updatedEvents = events.map((ev) =>
        ev.id.toString() === id ? { ...payload, id: ev.id } : ev
      );
      localStorage.setItem('festalytics_events', JSON.stringify(updatedEvents));
    } else {
      const newEvent = {
        ...payload,
        id: Date.now(),
        status: extra.status || 'Active',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('festalytics_events', JSON.stringify([...events, newEvent]));
    }
  };

  const handleSaveDraft = () => {
    saveToLocalStorage({ status: 'Draft' });
    router.push('/my-events');
  };

  const handleFinalizeEvent = async () => {
    setSubmitError('');
    const user = auth.currentUser;
    if (!user) {
      setSubmitError('Please log in to create an event and send your request to the venue.');
      router.push('/login');
      return;
    }

    if (!eventData.selectedVenueSlug) {
      setSubmitError('Please select a venue before creating your event.');
      return;
    }
    if (!eventData.date) {
      setSubmitError('Event date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedPkg = eventData.selectedCateringPackage;
      const menuPayload = {
        packageId: selectedPkg?.id || eventData.selectedCateringPackageId || '',
        packageName: selectedPkg?.name || 'Venue Hire Only',
        perPlatePrice: selectedPkg ? Number(selectedPkg.perPlatePrice) || 0 : 0,
        dishes: selectedPkg?.dishes || [],
      };

      const breakdown = eventData.budgetBreakdown || [];
      const hallRent = breakdown.find((b) => b.item === 'Hall Rent')?.amount ?? 0;
      const cateringCost =
        breakdown.find((b) => b.item?.startsWith('Catering:'))?.amount ?? 0;
      const addonsCost = breakdown
        .filter(
          (b) =>
            b.item !== 'Hall Rent' && !b.item?.startsWith('Catering:')
        )
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      const financials = {
        hallRent,
        cateringCost,
        addonsCost,
        grandTotal: eventData.budgetTotal || 0,
      };

      const customerName =
        user.displayName?.trim() || eventData.title?.trim() || 'Festalytics Customer';

      const quotationResult = await submitCustomerQuotation({
        userId: user.uid,
        customerName,
        targetVenueId: eventData.selectedVenueSlug,
        eventDate: eventData.date,
        guestCount: eventData.guestCount || 1,
        selectedMenu: menuPayload,
        eventTitle: eventData.title,
        eventType: eventData.eventType,
        eventTime: eventData.time,
        eventLocation: eventData.location,
        selectedAddons: eventData.selectedAddons,
        financials,
        source: 'create_event_wizard',
      });

      if (eventData.selectedVenueSlug === ZAYDAN_VENUE_SLUG) {
        try {
          await appendZaydanCallingRow(
            quotationToCallingRow({
              quotationId: quotationResult.quotationId,
              userId: user.uid,
              customerName,
              targetVenueId: eventData.selectedVenueSlug,
              eventDate: eventData.date,
              guestCount: eventData.guestCount,
              status: 'pending_vendor_approval',
              selectedMenu: { packageName: menuPayload.packageName },
            }),
            eventData.selectedVenueSlug
          );
        } catch (sheetErr) {
          console.warn('Zaydan calling sheet append failed:', sheetErr);
        }
      }

      saveToLocalStorage({
        quotationId: quotationResult.quotationId,
        status: 'Pending',
      });

      router.push('/my-events');
    } catch (err) {
      console.error('Create event quotation failed:', err);
      setSubmitError(err.message || 'Failed to submit your event request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <BasicDetails eventData={eventData} updateFormData={updateFormData} />;
      case 2:
        return (
          <VenueSelection
            eventData={eventData}
            updateFormData={updateFormData}
            handleBack={handleBack}
          />
        );
      case 3:
        return <Vendors eventData={eventData} updateFormData={updateFormData} />;
      case 4:
        return <Budget eventData={eventData} updateFormData={updateFormData} />;
      case 5:
        return (
          <Review
            eventData={eventData}
            onFinalize={handleFinalizeEvent}
            onSaveDraft={handleSaveDraft}
            isEditing={!!id}
            submitting={submitting}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 relative overflow-hidden min-h-[700px] flex flex-col"
        >
          <EventStepper currentStep={step} totalSteps={TOTAL_STEPS} />

          <div className="flex-1 flex flex-col">{renderStep()}</div>

          {step < TOTAL_STEPS && (
            <div className="flex justify-between items-center pt-6 mt-auto border-t border-gray-50">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-3 bg-[#D6336C] text-white rounded-full font-bold shadow-lg shadow-pink-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEvent;
