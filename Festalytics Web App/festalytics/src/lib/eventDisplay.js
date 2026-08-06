import { formatRs } from '@/lib/venuePricing';

export function loadEventById(eventId) {
  if (eventId == null || eventId === '') return null;
  const events = JSON.parse(localStorage.getItem('festalytics_events') || '[]');
  return events.find((e) => String(e.id) === String(eventId)) || null;
}

export function formatEventDate(dateStr) {
  if (!dateStr) return 'Date not set';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatEventTime(time) {
  if (!time) return '';
  const map = { morning: 'Morning', evening: 'Evening' };
  return map[time] || time;
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export function getEventLocation(event) {
  return (
    event?.selectedVenueLocation ||
    event?.selectedVenueName ||
    event?.location ||
    'Location not set'
  );
}

export function getStatusConfig(status) {
  const s = (status || 'Active').toLowerCase();
  if (s === 'pending' || s === 'quote request') {
    return { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (s === 'draft') {
    return { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
  if (s === 'confirmed' || s.includes('confirmed')) {
    return { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (s === 'declined') {
    return { label: 'Declined', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  return { label: status || 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export function persistEventStatus(eventId, status) {
  if (!eventId) return;
  const events = JSON.parse(localStorage.getItem('festalytics_events') || '[]');
  const updated = events.map((e) =>
    String(e.id) === String(eventId) ? { ...e, status } : e
  );
  localStorage.setItem('festalytics_events', JSON.stringify(updated));
}

export function getSelectedAddonLabels(event) {
  const addons = event?.selectedAddons || {};
  const labels = {
    ac: 'Air Conditioning',
    generator: 'Generator',
    decor: 'Decor Package',
    sound: 'Sound System',
    security: 'Security',
  };
  return Object.entries(addons)
    .filter(([, on]) => on)
    .map(([key]) => labels[key] || key);
}

export { formatRs };
