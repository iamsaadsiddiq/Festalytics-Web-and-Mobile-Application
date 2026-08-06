"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, MapPin, Users, PartyPopper } from 'lucide-react';
import PublicSiteHeader from './PublicSiteHeader';
import Footer from './Footer';
import HallCard from './HallCard';
import hallsData from '../data/halls.json';
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  buildVenueImagePath,
  mergePublicVenues,
} from "@/lib/publicVenues";
import { filterVenues } from "@/lib/venueFilters";
import { lahoreAreas } from "@/data/lahoreAreas";
import {
  heroEventTypeOptions,
  heroGuestCountOptions,
} from "@/data/heroSearchOptions";

function resolveLocationFromParam(loc) {
  if (!loc) return 'All';
  const matched = lahoreAreas.find(
    (a) =>
      a.toLowerCase() === loc.toLowerCase() ||
      a.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(a.toLowerCase())
  );
  return matched || 'All';
}

function resolveEventFromParam(event) {
  if (!event) return '';
  const match = heroEventTypeOptions.find(
    (opt) =>
      opt.label.toLowerCase() === event.toLowerCase() ||
      opt.value.toLowerCase() === event.toLowerCase()
  );
  return match?.value || '';
}

function resolveGuestsFromParam(guests) {
  if (!guests) return '';
  const match = heroGuestCountOptions.find((opt) => opt.value === guests);
  return match?.value || guests;
}

const AllVenuesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGuests, setSelectedGuests] = useState('');
  const [dbVenuesMap, setDbVenuesMap] = useState({});

  useEffect(() => {
    setSelectedLocation(resolveLocationFromParam(searchParams.get('location')));
    setSelectedEvent(resolveEventFromParam(searchParams.get('event')));
    setSelectedGuests(resolveGuestsFromParam(searchParams.get('guests')));
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "venues"),
      (querySnapshot) => {
        const venuesMap = {};
        querySnapshot.forEach((venueDoc) => {
          venuesMap[venueDoc.id] = venueDoc.data();
        });
        setDbVenuesMap(venuesMap);
      },
      (err) => {
        console.error("Error fetching all venues from Firestore: ", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const mergedHalls = useMemo(() => {
    return mergePublicVenues(hallsData, dbVenuesMap);
  }, [dbVenuesMap]);

  const locations = useMemo(() => ['All', ...lahoreAreas], []);

  const filteredHalls = useMemo(
    () =>
      filterVenues(mergedHalls, {
        searchTerm,
        location: selectedLocation,
        eventType: selectedEvent,
        guestCount: selectedGuests,
        dbVenuesMap,
      }),
    [mergedHalls, searchTerm, selectedLocation, selectedEvent, selectedGuests, dbVenuesMap]
  );

  const hasActiveFilters =
    searchTerm.trim() ||
    selectedLocation !== 'All' ||
    selectedEvent ||
    selectedGuests;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('All');
    setSelectedEvent('');
    setSelectedGuests('');
    router.replace('/all-venues');
  };

  const selectClass =
    'w-full pl-10 pr-10 py-3 appearance-none border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D6336C] focus:border-transparent outline-none transition-all bg-white text-sm';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <PublicSiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Marriage Halls</h1>
            <p className="text-gray-500 mt-1">Browse and filter through all available venues</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D6336C] focus:border-transparent outline-none transition-all"
              placeholder="Search by name or address..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className={selectClass}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'All' ? 'All Areas' : loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PartyPopper className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className={selectClass}
              >
                <option value="">All Event Types</option>
                {heroEventTypeOptions
                  .filter((opt) => opt.value)
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedGuests}
                onChange={(e) => setSelectedGuests(e.target.value)}
                className={selectClass}
              >
                {heroGuestCountOptions.map((opt) => (
                  <option key={opt.value || 'all-guests'} value={opt.value}>
                    {opt.value ? opt.label : 'Any Guest Count'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {filteredHalls.length} {filteredHalls.length === 1 ? 'Venue' : 'Venues'} Found
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#D6336C] font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredHalls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHalls.map((hall, index) => (
              <HallCard
                key={hall.hall_id || index}
                venue={hall}
                index={index}
                imagePath={buildVenueImagePath(hall)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No venues found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-[#D6336C] font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const AllVenues = () => (
  <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading venues…</div>}>
    <AllVenuesContent />
  </Suspense>
);

export default AllVenues;
