import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, Check, Users, Store, MapPin, X, UtensilsCrossed } from 'lucide-react';
import hallsData from '../../../data/halls.json';
import { lahoreAreas } from '../../../data/lahoreAreas';
import { db } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  buildVenueImagePath,
  mergePublicVenues,
  getPublicVenueDocId,
} from '@/lib/publicVenues';
import { resolveCateringPackages, getActivePricing, formatRs } from '@/lib/venuePricing';

const VenueSelection = ({ eventData, updateFormData, handleBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [dbVenuesMap, setDbVenuesMap] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'venues'),
      (snapshot) => {
        const next = {};
        snapshot.forEach((venueDoc) => {
          next[venueDoc.id] = venueDoc.data();
        });
        setDbVenuesMap(next);
      },
      (error) => {
        console.error('Error loading venues for event creation:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  const venues = useMemo(
    () => mergePublicVenues(hallsData, dbVenuesMap),
    [dbVenuesMap]
  );

  const filteredVenues = useMemo(() => {
    return venues.filter((hall) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (hall.hall_name && hall.hall_name.toLowerCase().includes(query)) ||
        (hall.area && hall.area.toLowerCase().includes(query)) ||
        (hall.full_address && hall.full_address.toLowerCase().includes(query));

      const matchesLocation =
        !eventData.location ||
        (hall.area && hall.area.toLowerCase() === eventData.location.toLowerCase());

      const matchesGuests =
        !eventData.guestCount ||
        (parseInt(hall.capacity_sitting, 10) || 0) >= parseInt(eventData.guestCount, 10);

      const slug = getPublicVenueDocId(hall);
      const dbVenue = slug ? dbVenuesMap[slug] : null;

      if (eventData.eventType && dbVenue?.eventTypes?.length) {
        const types = dbVenue.eventTypes.map((t) => String(t).toLowerCase());
        if (!types.includes(String(eventData.eventType).toLowerCase())) {
          return false;
        }
      }

      if (eventData.time && dbVenue?.availableTimings?.length) {
        const timings = dbVenue.availableTimings.map((t) => String(t).toLowerCase());
        if (!timings.includes(String(eventData.time).toLowerCase())) {
          return false;
        }
      }

      return matchesSearch && matchesLocation && matchesGuests;
    });
  }, [
    venues,
    searchQuery,
    eventData.location,
    eventData.guestCount,
    eventData.eventType,
    eventData.time,
    dbVenuesMap,
  ]);

  const selectedSlug = eventData.selectedVenueSlug;
  const selectedDbVenue = selectedSlug ? dbVenuesMap[selectedSlug] : null;
  const selectedHall = venues.find(
    (h) => getPublicVenueDocId(h) === selectedSlug || h.hall_id === eventData.selectedVenueId
  );

  const previewPackages = useMemo(() => {
    if (!selectedDbVenue && !selectedHall) return [];
    return resolveCateringPackages(selectedDbVenue, selectedHall).slice(0, 4);
  }, [selectedDbVenue, selectedHall]);

  const previewPricing = useMemo(
    () => getActivePricing(selectedDbVenue),
    [selectedDbVenue]
  );

  const clearFilters = () => {
    updateFormData('location', '');
    updateFormData('guestCount', '');
  };

  const handleSelectVenue = (hall) => {
    const slug = getPublicVenueDocId(hall);
    const dbData = slug ? dbVenuesMap[slug] : null;
    const pricing = getActivePricing(dbData);

    updateFormData('selectedVenueId', hall.hall_id);
    updateFormData('selectedVenueSlug', slug);
    updateFormData('selectedVenueName', hall.hall_name);
    updateFormData('selectedVenuePrice', hall.price_range || formatRs(pricing.hallRent));
    updateFormData('selectedVenueLocation', hall.full_address || hall.area);
    updateFormData('venuePreviewImage', buildVenueImagePath(hall));
    updateFormData('selectedCateringPackageId', '');
    updateFormData('selectedCateringPackage', null);
  };

  const eventTypeMatches = (hall) => {
    if (!eventData.eventType) return false;
    const slug = getPublicVenueDocId(hall);
    const dbVenue = slug ? dbVenuesMap[slug] : null;
    if (!dbVenue?.eventTypes?.length) return false;
    return dbVenue.eventTypes
      .map((t) => String(t).toLowerCase())
      .includes(String(eventData.eventType).toLowerCase());
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-center mb-6 shrink-0">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Select a Venue</h1>
        <p className="text-gray-500">
          Halls matching your event requirements — date, guests, and location.
        </p>
      </div>

      {(eventData.location || eventData.guestCount || eventData.eventType) && (
        <div className="flex flex-wrap items-center gap-3 mb-6 px-4 py-3 bg-white border-b border-[#D6336C]/10 shrink-0">
          <span className="text-sm font-medium text-gray-500">Active Filters:</span>
          {eventData.location && (
            <div className="flex items-center gap-1.5 bg-[#D6336C] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <MapPin size={12} /> {eventData.location}
              <button
                type="button"
                onClick={() => updateFormData('location', '')}
                className="hover:text-pink-200 ml-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {eventData.guestCount && (
            <div className="flex items-center gap-1.5 bg-[#D6336C] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <Users size={12} /> {eventData.guestCount}+ Guests
              <button
                type="button"
                onClick={() => updateFormData('guestCount', '')}
                className="hover:text-pink-200 ml-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {eventData.eventType && (
            <div className="flex items-center gap-1.5 bg-gray-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm capitalize">
              {eventData.eventType}
            </div>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-bold text-[#D6336C] hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full mb-6 px-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hall name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute top-3.5 left-3.5 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#D6336C]/20 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none bg-white text-sm font-medium transition-all"
              value={eventData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
            >
              <option value="">All Areas</option>
              {lahoreAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <Users className="absolute top-3.5 left-3.5 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="number"
              placeholder="Min. Guests"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#D6336C]/20 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm font-medium"
              value={eventData.guestCount}
              onChange={(e) => updateFormData('guestCount', e.target.value)}
            />
          </div>
        </div>
      </div>

      {selectedSlug && selectedHall && (
        <div className="mx-4 mb-6 p-5 bg-gradient-to-r from-pink-50 to-white border border-[#D6336C]/20 rounded-2xl shrink-0">
          <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <Check size={20} className="text-[#D6336C]" />
            Selected: {eventData.selectedVenueName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <img
                src={eventData.venuePreviewImage || buildVenueImagePath(selectedHall)}
                alt={eventData.selectedVenueName}
                className="w-full h-32 object-cover rounded-xl"
              />
            </div>
            <div className="md:col-span-2 space-y-2 text-sm">
              <p className="text-gray-600 flex items-center gap-1">
                <MapPin size={14} />
                {eventData.selectedVenueLocation}
              </p>
              <p className="text-gray-600 flex items-center gap-1">
                <Users size={14} />
                Capacity: {selectedHall.capacity_sitting || 'N/A'} guests
              </p>
              <p className="font-bold text-[#D6336C]">
                Hall Rent: {formatRs(previewPricing.hallRent)}
              </p>
              {previewPackages.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-800 mb-1 flex items-center gap-1">
                    <UtensilsCrossed size={14} /> Menu packages
                  </p>
                  <ul className="text-gray-600 space-y-0.5">
                    {previewPackages.map((pkg) => (
                      <li key={pkg.id}>
                        {pkg.name} — {formatRs(pkg.perPlatePrice)}/head
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto px-1 pb-4 flex-1">
        {filteredVenues.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.slice(0, visibleCount).map((hall, index) => {
                const slug = getPublicVenueDocId(hall);
                const isSelected = eventData.selectedVenueSlug === slug;
                const rating = hall.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
                const matchesEvent = eventTypeMatches(hall);

                return (
                  <div
                    key={hall.hall_id || index}
                    onClick={() => handleSelectVenue(hall)}
                    className={`group relative bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${
                      isSelected
                        ? 'border-[#D6336C] shadow-lg ring-2 ring-pink-100'
                        : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                    }`}
                  >
                    <div className="h-40 relative bg-gray-200 shrink-0">
                      <img
                        src={buildVenueImagePath(hall)}
                        alt={hall.hall_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#D6336C] text-white p-1 rounded-full shadow-sm z-10">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                      {matchesEvent && (
                        <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Matches your event
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-[#D6336C] transition-colors line-clamp-1">
                          {hall.hall_name}
                        </h3>
                        <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                          <Star size={10} className="fill-current mr-0.5" /> {rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                        <MapPin size={12} className="shrink-0" />
                        <span className="line-clamp-1">
                          {hall.full_address || hall.area || 'Lahore'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-500 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="shrink-0 text-blue-500" />{' '}
                          {hall.capacity_sitting || 'N/A'} Guests
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-[#D6336C]">
                          <Store size={14} className="shrink-0" />{' '}
                          {hall.price_range || 'Contact for price'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`w-full mt-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          isSelected
                            ? 'bg-[#D6336C] text-white'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select Venue'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredVenues.length > visibleCount && (
              <div className="text-center mt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-6 py-2 border border-gray-300 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Show More Venues
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 mx-4">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={40} className="text-[#D6336C]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Halls Found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">
              No halls match your requirements in {eventData.location || 'this area'} for{' '}
              {eventData.guestCount || 'the'} requested guest count.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="px-8 py-3 bg-[#D6336C] text-white rounded-full font-bold shadow-lg shadow-pink-200 hover:brightness-110 transition-all active:scale-95"
            >
              Change Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueSelection;
