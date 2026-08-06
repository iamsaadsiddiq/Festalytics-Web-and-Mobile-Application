import { getPublicVenueDocId } from './publicVenues';

const EVENT_KEYWORDS = {
  wedding: ['wedding', 'walima', 'reception', 'shaadi', 'marriage'],
  birthday: ['birthday'],
  corporate: ['corporate', 'conference', 'meeting', 'seminar'],
  party: ['party'],
  other: [],
};

/** Minimum seated capacity a hall should support for each hero guest-range value. */
export const GUEST_FILTER_MIN_CAPACITY = {
  100: 1,
  300: 100,
  500: 300,
  1000: 500,
  '1000+': 1000,
};

export function normalizeEventFilter(event) {
  if (!event) return '';
  const lower = String(event).toLowerCase().trim();
  if (EVENT_KEYWORDS[lower]) return lower;
  for (const [key, keywords] of Object.entries(EVENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw)) || lower.includes(key)) {
      return key;
    }
  }
  return lower;
}

export function matchesVenueSearch(hall, searchTerm) {
  const query = (searchTerm || '').trim().toLowerCase();
  if (!query) return true;
  return (
    (hall.hall_name && hall.hall_name.toLowerCase().includes(query)) ||
    (hall.full_address && hall.full_address.toLowerCase().includes(query)) ||
    (hall.area && hall.area.toLowerCase().includes(query))
  );
}

export function matchesVenueLocation(hall, location) {
  if (!location || location === 'All') return true;
  const hallArea = (hall.area || '').toLowerCase();
  const selected = String(location).toLowerCase();
  return (
    hallArea === selected ||
    hallArea.includes(selected) ||
    selected.includes(hallArea)
  );
}

export function matchesVenueGuestCount(hall, guestFilter) {
  if (!guestFilter) return true;
  const capacity = parseInt(hall.capacity_sitting, 10) || 0;
  const minCapacity = GUEST_FILTER_MIN_CAPACITY[guestFilter] ?? parseInt(guestFilter, 10);
  if (!Number.isFinite(minCapacity)) return true;
  return capacity >= minCapacity;
}

export function matchesVenueEventType(hall, eventFilter, dbVenuesMap = {}) {
  if (!eventFilter) return true;

  const normalized = normalizeEventFilter(eventFilter);
  const slug = getPublicVenueDocId(hall);
  const dbVenue = slug ? dbVenuesMap[slug] : null;

  if (dbVenue?.eventTypes?.length) {
    const types = dbVenue.eventTypes.map((t) => String(t).toLowerCase());
    return types.includes(normalized);
  }

  if (normalized === 'other') return true;

  const keywords = EVENT_KEYWORDS[normalized] || [normalized];
  if (!keywords.length) return true;

  const haystack = `${hall.keywords || ''} ${hall.description || ''} ${hall.category || ''}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export function filterVenues(halls, { searchTerm, location, eventType, guestCount, dbVenuesMap = {} }) {
  return halls.filter((hall) => {
    return (
      matchesVenueSearch(hall, searchTerm) &&
      matchesVenueLocation(hall, location) &&
      matchesVenueEventType(hall, eventType, dbVenuesMap) &&
      matchesVenueGuestCount(hall, guestCount)
    );
  });
}
