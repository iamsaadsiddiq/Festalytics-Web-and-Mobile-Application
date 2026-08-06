import { EVENT_TYPES } from '@/components/create-event/data'

export const heroEventTypeOptions = [
  { value: '', label: 'Select event type' },
  ...EVENT_TYPES.map((type) => ({ value: type.id, label: type.label })),
]

export const heroGuestCountOptions = [
  { value: '', label: 'Any guest count' },
  { value: '100', label: 'Up to 100 guests' },
  { value: '300', label: '100 – 300 guests' },
  { value: '500', label: '300 – 500 guests' },
  { value: '1000', label: '500 – 1,000 guests' },
  { value: '1000+', label: '1,000+ guests' },
]
