import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Building2,
  UtensilsCrossed,
  Sparkles,
  Wallet,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';
import {
  loadEventById,
  formatEventDate,
  formatEventTime,
  formatRs,
  getDaysUntil,
  getEventLocation,
  getStatusConfig,
  getSelectedAddonLabels,
  persistEventStatus,
} from '@/lib/eventDisplay';
import {
  listenToQuotationById,
  mapQuotationStatusToUi,
  QUOTATION_STATUS,
} from '@/lib/firestore/quotations';

const ManageEvent = () => {
  const router = useRouter();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const found = loadEventById(eventId);
    setEvent(found);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!event?.quotationId) return undefined;

    const unsubscribe = listenToQuotationById(event.quotationId, (quotation) => {
      if (!quotation) return;

      let nextStatus = event.status;
      const fs = String(quotation.status || '').toLowerCase();

      if (fs === QUOTATION_STATUS.CONFIRMED) {
        nextStatus = 'Confirmed';
      } else if (fs === QUOTATION_STATUS.DECLINED) {
        nextStatus = 'Declined';
      } else if (fs === QUOTATION_STATUS.PENDING) {
        nextStatus = 'Pending';
      } else if (fs === QUOTATION_STATUS.COUNTER) {
        nextStatus = 'Counter Offer';
      }

      setEvent((prev) => {
        if (!prev || prev.status === nextStatus) return prev;
        persistEventStatus(prev.id, nextStatus);
        return {
          ...prev,
          status: nextStatus,
          quotationFirestoreStatus: quotation.status,
          quotationUiStatus: mapQuotationStatusToUi(quotation.status),
        };
      });
    });

    return () => unsubscribe();
  }, [event?.quotationId]);

  const daysLeft = useMemo(() => getDaysUntil(event?.date), [event?.date]);
  const status = useMemo(() => getStatusConfig(event?.status), [event?.status]);
  const addonLabels = useMemo(() => getSelectedAddonLabels(event), [event]);
  const pkg = event?.selectedCateringPackage;

  const tabs = ['Overview', 'Menu & Services', 'Budget'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading event…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
          <p className="text-gray-500 mb-6">This event may have been deleted or the link is invalid.</p>
          <button
            type="button"
            onClick={() => router.push('/my-events')}
            className="inline-flex items-center gap-2 text-[#D6336C] font-bold hover:underline"
          >
            <ArrowLeft size={18} /> Back to My Events
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          type="button"
          onClick={() => router.push('/my-events')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#D6336C] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Events
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {event.title || 'Untitled Event'}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border capitalize ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-[#D6336C]" />
                {formatEventDate(event.date)}
              </span>
              {event.time && (
                <span className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#D6336C]" />
                  {formatEventTime(event.time)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-[#D6336C]" />
                {getEventLocation(event)}
              </span>
              {event.guestCount && (
                <span className="flex items-center gap-1.5">
                  <Users size={16} className="text-[#D6336C]" />
                  {event.guestCount} guests
                </span>
              )}
            </div>
            {event.eventType && (
              <p className="text-sm text-gray-400 mt-2 capitalize">Event type: {event.eventType}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/edit-event/${event.id}`)}
            className="w-full md:w-auto px-6 py-3 bg-[#D6336C] text-white font-bold rounded-xl shadow-lg shadow-pink-200 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Edit size={18} /> Edit Event
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#D6336C] text-[#D6336C]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Days Until Event"
                  value={daysLeft != null ? (daysLeft >= 0 ? daysLeft : 'Past') : '—'}
                  sub={daysLeft != null && daysLeft < 0 ? 'Event date passed' : undefined}
                />
                <StatCard
                  label="Estimated Budget"
                  value={event.budgetTotal > 0 ? formatRs(event.budgetTotal) : '—'}
                />
                <StatCard label="Guests" value={event.guestCount || '—'} />
                <StatCard
                  label="Quotation"
                  value={event.quotationId ? 'Submitted' : 'Not sent'}
                  sub={event.quotationId ? `ID: ${event.quotationId.slice(0, 8)}…` : 'Draft only'}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-[#D6336C]" />
                    Venue
                  </h3>
                  {event.selectedVenueName ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-bold text-gray-900 text-base">{event.selectedVenueName}</p>
                      <p className="text-gray-600">{event.selectedVenueLocation || event.location}</p>
                      {event.selectedVenuePrice && (
                        <p className="text-[#D6336C] font-semibold">{event.selectedVenuePrice}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No venue selected</p>
                  )}
                </section>

                <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <UtensilsCrossed size={20} className="text-[#D6336C]" />
                    Catering Summary
                  </h3>
                  {pkg ? (
                    <div className="text-sm space-y-2">
                      <p className="font-bold text-gray-900">{pkg.name}</p>
                      <p className="text-[#D6336C] font-semibold">
                        {formatRs(pkg.perPlatePrice)}/head
                      </p>
                      {pkg.dishes?.length > 0 && (
                        <p className="text-gray-500">{pkg.dishes.join(' · ')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Venue hire only / no menu selected</p>
                  )}
                </section>
              </div>

              {event.quotationId && (
                <div
                  className={`rounded-2xl p-5 flex items-start gap-3 border ${
                    (event.status || '').toLowerCase() === 'confirmed'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  <FileText
                    className={`shrink-0 mt-0.5 ${
                      (event.status || '').toLowerCase() === 'confirmed'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                    size={22}
                  />
                  <div>
                    <p
                      className={`font-bold ${
                        (event.status || '').toLowerCase() === 'confirmed'
                          ? 'text-emerald-900'
                          : 'text-amber-900'
                      }`}
                    >
                      {(event.status || '').toLowerCase() === 'confirmed'
                        ? 'Confirmed / Scheduled by venue'
                        : 'Quotation pending vendor approval'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        (event.status || '').toLowerCase() === 'confirmed'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {(event.status || '').toLowerCase() === 'confirmed'
                        ? 'Your event date is locked. The venue has accepted your proposal in their ERP.'
                        : 'The venue will review your selected menu and budget estimate. Status updates live here.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Menu & Services' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <UtensilsCrossed size={20} className="text-[#D6336C]" />
                  Selected Menu
                </h3>
                {pkg ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                      <p className="font-bold text-gray-900">{pkg.name}</p>
                      {pkg.type && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{pkg.type}</p>
                      )}
                      <p className="text-[#D6336C] font-bold mt-2">
                        {formatRs(pkg.perPlatePrice)} per guest
                      </p>
                      {event.guestCount && (
                        <p className="text-sm text-gray-600 mt-1">
                          Subtotal:{' '}
                          {formatRs(
                            (Number(pkg.perPlatePrice) || 0) * (parseInt(event.guestCount, 10) || 1)
                          )}{' '}
                          ({event.guestCount} guests)
                        </p>
                      )}
                    </div>
                    {pkg.dishes?.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {pkg.dishes.map((dish) => (
                          <li key={dish}>{dish}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No catering package selected</p>
                )}
              </section>

              <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-[#D6336C]" />
                  Add-ons
                </h3>
                {addonLabels.length > 0 ? (
                  <ul className="space-y-2">
                    {addonLabels.map((label) => (
                      <li
                        key={label}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-800"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#D6336C]" />
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No add-ons selected</p>
                )}
              </section>
            </div>
          )}

          {activeTab === 'Budget' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Wallet size={20} className="text-[#D6336C]" />
                    Budget Breakdown
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on your venue, menu, and service selections
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Grand Total</p>
                  <p className="text-2xl font-bold text-[#D6336C]">
                    {formatRs(event.budgetTotal || 0)}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {(event.budgetBreakdown || []).length > 0 ? (
                  event.budgetBreakdown.map((row, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex justify-between text-sm hover:bg-gray-50/50"
                    >
                      <span className="text-gray-700">{row.item}</span>
                      <span className="font-bold text-gray-900">{row.display}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-8 text-center text-gray-400 italic">
                    No budget data saved for this event. Edit the event to recalculate.
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default ManageEvent;
