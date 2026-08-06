import React from 'react';
import { ArrowRight, Info, MapPin, Users, Save, UtensilsCrossed, Sparkles } from 'lucide-react';
import { formatRs } from '@/lib/venuePricing';

const Review = ({
  eventData,
  onFinalize,
  onSaveDraft,
  isEditing,
  submitting,
  submitError,
}) => {
  const pkg = eventData.selectedCateringPackage;
  const addons = eventData.selectedAddons || {};
  const addonLabels = {
    ac: 'Air Conditioning',
    generator: 'Generator',
    decor: 'Decor Package',
    sound: 'Sound System',
    security: 'Security',
  };
  const selectedAddonNames = Object.entries(addons)
    .filter(([, v]) => v)
    .map(([k]) => addonLabels[k] || k);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Review & Finalize</h1>
        <p className="text-gray-500">
          Review all details before {isEditing ? 'updating' : 'creating'} your event. Submitting
          sends a quotation request to the venue&apos;s ERP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Info size={20} className="text-[#D6336C]" /> Event Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Event Title</span>
              <span className="font-bold text-gray-900">{eventData.title || 'Not Set'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Type</span>
              <span className="font-bold text-gray-900 capitalize">
                {eventData.eventType || 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-bold text-gray-900">
                {eventData.date || '—'} {eventData.time ? `· ${eventData.time}` : ''}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Location</span>
              <span className="font-bold text-gray-900">{eventData.location || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Guests</span>
              <span className="font-bold text-gray-900">{eventData.guestCount || '—'} People</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-[#D6336C]" /> Venue
          </h3>
          {eventData.selectedVenueSlug ? (
            <div>
              {eventData.venuePreviewImage && (
                <img
                  src={eventData.venuePreviewImage}
                  alt="Venue"
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
              )}
              <h4 className="font-bold text-gray-900">{eventData.selectedVenueName}</h4>
              <p className="text-sm text-gray-500 mt-1">{eventData.selectedVenueLocation}</p>
              <p className="text-sm font-semibold text-[#D6336C] mt-2">
                {eventData.selectedVenuePrice}
              </p>
            </div>
          ) : (
            <div className="text-gray-400 italic">No venue selected</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-[#D6336C]" /> Menu & Catering
          </h3>
          {pkg ? (
            <div>
              <p className="font-bold text-gray-900">{pkg.name}</p>
              <p className="text-[#D6336C] font-semibold mt-1">
                {formatRs(pkg.perPlatePrice)}/head
              </p>
              {pkg.dishes?.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">{pkg.dishes.join(' · ')}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic">No menu selected</p>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-[#D6336C]" /> Add-ons
          </h3>
          {selectedAddonNames.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {selectedAddonNames.map((name) => (
                <li key={name} className="flex items-center gap-2 text-gray-700">
                  <CheckIcon /> {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No add-ons selected</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#D6336C]" /> Budget Summary
        </h3>
        <div className="divide-y divide-gray-50 text-sm mb-4">
          {(eventData.budgetBreakdown || []).map((row, idx) => (
            <div key={idx} className="flex justify-between py-2">
              <span className="text-gray-600">{row.item}</span>
              <span className="font-bold">{row.display}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-lg">
          <span>Grand Total</span>
          <span className="text-[#D6336C]">{formatRs(eventData.budgetTotal || 0)}</span>
        </div>
      </div>

      {submitError && (
        <p className="text-red-600 text-sm text-center mb-4 font-medium">{submitError}</p>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={submitting}
          className="flex-1 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} /> Save as Draft
        </button>
        <button
          type="button"
          onClick={onFinalize}
          disabled={submitting}
          className="flex-[2] py-4 bg-[#D6336C] text-white font-bold rounded-2xl shadow-lg shadow-pink-200 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting
            ? 'Submitting…'
            : isEditing
              ? 'Update Event'
              : 'Create Event'}{' '}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

function CheckIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
      ✓
    </span>
  );
}

export default Review;
