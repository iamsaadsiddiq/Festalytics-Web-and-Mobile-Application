import hallsData from '@/data/halls.json';
import { lahoreAreas } from '@/data/lahoreAreas';
import { filterVenues } from '@/lib/venueFilters';

const GREETING_RE = /^(hi|hello|hey|salam|aoa|assalam|good\s+(morning|evening|afternoon))\b/i;

function extractGuestCount(message) {
  const match = String(message || '').match(/(\d{2,4})\s*(?:guests?|people|persons?|pax)?/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractArea(message) {
  const lower = String(message || '').toLowerCase();
  return (
    lahoreAreas.find(
      (area) =>
        lower.includes(area.toLowerCase()) ||
        area.toLowerCase().split(/[\s(,]+/).some((part) => part.length > 3 && lower.includes(part))
    ) || null
  );
}

function extractEventType(message) {
  const lower = String(message || '').toLowerCase();
  if (/wedding|walima|reception|shaadi|marriage|mehndi|barat/.test(lower)) return 'wedding';
  if (/birthday/.test(lower)) return 'birthday';
  if (/corporate|conference|seminar|meeting/.test(lower)) return 'corporate';
  if (/party/.test(lower)) return 'party';
  return '';
}

function hallImages(hall) {
  return (hall.images || [])
    .slice(0, 3)
    .map((path) => ({
      url: path.replace('/Marriage Hall/', '/Marriage_hall/'),
      filename: path.split('/').pop() || 'image',
    }));
}

function formatHallCard(hall) {
  return {
    name: hall.hall_name,
    area: hall.area || '',
    address: hall.full_address || '',
    rating: null,
    capacity_sitting: parseInt(hall.capacity_sitting, 10) || 0,
    minimum_guests: 0,
    images: hallImages(hall),
  };
}

function buildReply(message, halls, filters) {
  if (halls.length === 0) {
    return (
      'I could not find halls matching that request in the Festalytics database. ' +
      'Try asking about a Lahore area such as Gulberg, Johar Town, or DHA, or mention guest count and budget.'
    );
  }

  const filterBits = [];
  if (filters.location && filters.location !== 'All') filterBits.push(filters.location);
  if (filters.eventType) filterBits.push(`${filters.eventType} events`);
  if (filters.guestCount) filterBits.push(`around ${filters.guestCount} guests`);

  const intro = filterBits.length
    ? `Here are ${halls.length} marriage halls in Lahore matching ${filterBits.join(', ')}:`
    : `Here are ${halls.length} recommended marriage halls in Lahore:`;

  const lines = [`## ${intro}`, ''];

  halls.slice(0, 5).forEach((hall, index) => {
    const chicken = hall.one_dish_chicken ? `PKR ${Number(hall.one_dish_chicken).toLocaleString()}` : 'Contact for pricing';
    lines.push(
      `### ${index + 1}. ${hall.hall_name}`,
      `- Area: ${hall.area || 'Lahore'}`,
      `- Capacity: up to ${hall.capacity_sitting || 'N/A'} guests`,
      `- Chicken per head: ${chicken}`,
      `- Address: ${hall.full_address || 'Available on request'}`,
      ''
    );
  });

  lines.push(
    '> Local fallback mode is active because the Python AI backend is offline. Start it on port 8001 for full Groq RAG answers.'
  );

  return lines.join('\n');
}

export function fallbackRagChat(message) {
  const text = String(message || '').trim();
  if (!text) {
    return {
      reply: 'Please ask a marriage hall question.',
      filters_used: {},
      exact_matches: 0,
      halls_shown: 0,
      halls: [],
      model: 'festalytics-local-fallback',
      fallback: true,
    };
  }

  if (GREETING_RE.test(text)) {
    return {
      reply:
        'Hello! I am your Lahore wedding hall assistant. Ask me about venues by area, capacity, budget, food package, or amenities.',
      filters_used: {},
      exact_matches: 0,
      halls_shown: 0,
      halls: [],
      model: 'festalytics-local-fallback',
      fallback: true,
    };
  }

  const area = extractArea(text);
  const guestCount = extractGuestCount(text);
  const eventType = extractEventType(text);

  const guestFilter =
    guestCount >= 1000 ? '1000+' : guestCount >= 500 ? '1000' : guestCount >= 300 ? '500' : guestCount >= 100 ? '300' : guestCount ? '100' : '';

  const hasStructuredFilters = Boolean(area || guestCount || eventType);

  const filtered = filterVenues(hallsData, {
    searchTerm: hasStructuredFilters ? '' : text,
    location: area || 'All',
    eventType,
    guestCount: guestFilter,
    dbVenuesMap: {},
  });

  const ranked =
    filtered.length > 0
      ? filtered
      : filterVenues(hallsData, {
          searchTerm: text,
          location: 'All',
          eventType: '',
          guestCount: '',
          dbVenuesMap: {},
        });
  const top = ranked.slice(0, 5);

  return {
    reply: buildReply(text, ranked, {
      location: area,
      eventType,
      guestCount: guestCount || '',
    }),
    filters_used: {
      ...(area ? { area } : {}),
      ...(eventType ? { eventType } : {}),
      ...(guestCount ? { guests: guestCount } : {}),
    },
    exact_matches: filtered.length || ranked.length,
    halls_shown: top.length,
    halls: top.map(formatHallCard).filter((hall) => hall.images.length > 0),
    model: 'festalytics-local-fallback',
    fallback: true,
  };
}
