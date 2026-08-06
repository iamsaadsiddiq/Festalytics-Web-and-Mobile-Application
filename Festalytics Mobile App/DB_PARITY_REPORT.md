# DATABASE / FIRESTORE PARITY REPORT

## Overview
This document compares every Firestore collection and helper from the web application against its Flutter implementation.

---

## FIRESTORE COLLECTIONS

| Collection | Web Usage | Flutter Service | Status |
|-----------|-----------|----------------|--------|
| `users/{userId}` | User profiles, role, venueId, onboarding | `lib/services/users_service.dart` | ✅ Full parity |
| `venues/{venueId}` | Venue profiles, pricing, calendar, inventory | `lib/services/venues_service.dart` | ✅ Full parity |
| `bookings/{bookingId}` | Booking records linked to venues | `lib/services/bookings_service.dart` | ✅ Full parity |
| `quotations/{quotationId}` | Quotation requests from customers | `lib/services/quotations_service.dart` | ✅ Full parity |
| `events/{eventId}` | User-created event plans | `lib/services/events_service.dart` | ✅ Full parity |
| `chats/{chatId}` | Chat rooms between customers/vendors | `lib/services/chat_service.dart` | ✅ Full parity |
| `chats/{chatId}/messages/{messageId}` | Message threads | `lib/services/chat_service.dart` | ✅ Full parity |
| `inventory_listings/{listingId}` | Borrow hub inventory published by vendors | `lib/services/borrow_hub_service.dart` | ✅ Full parity |
| `borrow_requests/{requestId}` | Vendor-to-vendor borrow requests | `lib/services/borrow_hub_service.dart` | ✅ Full parity |

---

## WEB HELPERS vs FLUTTER EQUIVALENTS

### Users / Auth
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/auth/pendingActions.js` | `lib/web_clone/src/lib/auth/pendingActions.dart` | PendingActionQueue | ✅ |
| `src/lib/firestore/vendorOnboarding.js` | `lib/web_clone/src/lib/firestore/vendorOnboarding.dart` | VendorOnboarding resolver, step handling | ✅ |
| `src/context/AuthContext.jsx` | `lib/web_clone/src/context/AuthContext.dart` | AuthContext ChangeNotifier | ✅ |
| (AuthContext Provider) | `lib/providers/app_auth_provider.dart` | AppAuthProvider with Firebase Auth + Firestore | ✅ |
| `src/components/ProtectedRoute.jsx` | `lib/web_clone/src/components/ProtectedRoute.dart` | ProtectedRoute role guard widget | ✅ |

### Venues
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/publicVenues.js` | `lib/web_clone/src/lib/publicVenues.dart` | PublicVenueDisplay mapper | ✅ |
| `src/lib/venueFilters.js` | `lib/web_clone/src/lib/venueFilters.dart` | VenueFilters with criteria | ✅ |
| `src/lib/venuePricing.js` | `lib/web_clone/src/lib/venuePricing.dart` | VenuePricingModel, BudgetCalculator | ✅ |
| `src/lib/venueFaqs.js` | `lib/web_clone/src/lib/venueFaqs.dart` | VenueFaq normalization | ✅ |
| `src/lib/firestore/venueCalendar.js` | `lib/web_clone/src/lib/firestore/venueCalendar.dart` | FirestoreVenueCalendar CRUD | ✅ |
| `src/lib/firestore/venueMyServicesState.js` | `lib/web_clone/src/lib/firestore/venueMyServicesState.dart` | VenueMyServicesState builder | ✅ |
| `src/hooks/useVenueCalendar.js` | `lib/web_clone/src/hooks/useVenueCalendar.dart` | VenueCalendar + CalendarState | ✅ |
| `src/hooks/useVendorVenue.js` | `lib/web_clone/src/hooks/useVendorVenue.dart` | VendorVenueResolver | ✅ |
| (Venue Service) | `lib/services/venues_service.dart` | CRUD, provision, link, slugify, buildDefaultVenueDocument, buildVenueSavePayload | ✅ |
| (Venue Model) | `lib/models/venue.dart` | Venue, VenueProfile, VenuePricing, VenueOperatingHours | ✅ |

### Bookings
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/firestore/bookings.js` | `lib/web_clone/src/lib/firestore/bookings.dart` | FirestoreBookings: submit, listen, legacy fetch | ✅ |
| (Booking Service) | `lib/services/bookings_service.dart` | submitWalkInBooking, listenToVenueBookings, fetchLegacyVenueBookings | ✅ |
| (Booking Model) | `lib/models/booking.dart` | Booking with event details, financials | ✅ |

### Quotations
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/firestore/quotations.js` | `lib/web_clone/src/lib/firestore/quotations.dart` | FirestoreQuotations: submit, listen, map to row | ✅ |
| (Quotation Service) | `lib/services/quotations_service.dart` | submitCustomerQuotation, listenToIncomingQuotations, mapQuotationToBookingRow | ✅ |
| (Quotation Model) | `lib/models/quotation.dart` | Quotation with status, menu, pricing | ✅ |

### Chats
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/firestore/chats.js` | `lib/web_clone/src/lib/firestore/chats.dart` | FirestoreChats: CRUD, listen, send | ✅ |
| `src/lib/chatUtils.js` | `lib/web_clone/src/lib/chatUtils.dart` | ChatIdBuilder, MessageFormatter | ✅ |
| `src/hooks/useVendorInbox.js` | `lib/web_clone/src/hooks/useVendorInbox.dart` | VendorInbox stream helper | ✅ |
| `src/hooks/useChatMessages.js` | `lib/web_clone/src/hooks/useChatMessages.dart` | ChatMessages stream helper | ✅ |
| (Chat Service) | `lib/services/chat_service.dart` | buildChatId, streamInbox, streamMessages, ensureRoom, sendMessage | ✅ |
| (Chat Model) | `lib/models/chat.dart` | ChatMessage, ChatThread | ✅ |

### Borrow Hub
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/firestore/borrowHub.js` | `lib/web_clone/src/lib/firestore/borrowHub.dart` | FirestoreBorrowHub: full lifecycle | ✅ |
| `src/lib/borrowHubUtils.js` | `lib/web_clone/src/lib/borrowHubUtils.dart` | BorrowHubUtils: categories, filters, status labels | ✅ |
| `src/hooks/useBorrowHub.js` | `lib/web_clone/src/hooks/useBorrowHub.dart` | BorrowHub + BorrowHubState | ✅ |
| (Borrow Hub Service) | `lib/services/borrow_hub_service.dart` | Full lifecycle: listings sync, request CRUD, accept/decline/cancel, in_use/returned, inventory restore | ✅ |
| (Inventory Model) | `lib/models/inventory_listing.dart` | InventoryListing with category, quantity, pricing | ✅ |
| (Borrow Request Model) | `lib/models/borrow_request.dart` | BorrowRequest with status, items, activity log | ✅ |

### Analytics
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/hooks/useVendorAnalyticsData.js` | `lib/web_clone/src/hooks/useVendorAnalyticsData.dart` | VendorAnalyticsData + VendorAnalyticsSnapshot | ✅ |
| (Analytics Service) | `lib/services/analytics_service.dart` | streamVendorAnalytics: bookings + quotations aggregation | ✅ |

### Events
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/eventDisplay.js` | `lib/web_clone/src/lib/eventDisplay.dart` | EventDisplay + EventDisplayInfo | ✅ |
| (Events Service) | `lib/services/events_service.dart` | streamUserEvents, getEvent, saveEvent, deleteEvent | ✅ |

### Messages / Templates
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/messageTemplates.js` | `lib/web_clone/src/lib/messageTemplates.dart` | MessageTemplates CRUD | ✅ |
| `src/lib/messageInboxFilters.js` | `lib/web_clone/src/lib/messageInboxFilters.dart` | MessageInboxFilters: all, unread, pending, archived | ✅ |

### Google Sheets
| Web File | Flutter File | Key Implementations | Status |
|----------|-------------|-------------------|--------|
| `src/lib/google/sheetsAuth.js` | `lib/web_clone/src/lib/google/sheetsAuth.dart` | SheetsAuth: JWT auth, sheet tab resolution | ✅ |
| `src/lib/google/zaydanCallingSheet.js` | `lib/web_clone/src/lib/google/zaydanCallingSheet.dart` | ZaydanCallingSheet: row builders, append/sync | ✅ |

---

## FIRESTORE DOCUMENT STRUCTURES

### users/{uid}
| Field | Web | Flutter | Par |
|-------|-----|---------|-----|
| `uid` | ✅ | `AppUser.uid` | ✅ |
| `firstName` | ✅ | `AppUser.firstName` | ✅ |
| `lastName` | ✅ | `AppUser.lastName` | ✅ |
| `fullName` | ✅ | `AppUser.fullName` | ✅ |
| `email` | ✅ | `AppUser.email` | ✅ |
| `mobile` | ✅ | `AppUser.mobileNumber` | ✅ |
| `role` | ✅ | `AppUser.role` | ✅ |
| `venueId` | ✅ | `AppUser.venueId` | ✅ |
| `onboardingComplete` | ✅ | `AppUser.onboardingComplete` | ✅ |
| `pendingVendorOnboarding` | ✅ | Handled in signup | ✅ |
| `cnic` | ✅ | `AppUser.cnic` | ✅ |
| `authProvider` | ✅ | Set during signup | ✅ |

### venues/{venueId}
| Field | Web | Flutter | Par |
|-------|-----|---------|-----|
| `name`, `hallName` | ✅ | `Venue.name/hallName` | ✅ |
| `description` | ✅ | `Venue.description` | ✅ |
| `streetAddress` | ✅ | `Venue.streetAddress` | ✅ |
| `city` | ✅ | `Venue.city` | ✅ |
| `capacity` | ✅ | `Venue.capacity` | ✅ |
| `venueType` | ✅ | `Venue.venueType` | ✅ |
| `categories` | ✅ | `Venue.categories` | ✅ |
| `profile` | ✅ | `VenueProfile` | ✅ |
| `pricing` | ✅ | `VenuePricing` | ✅ |
| `cateringPackages` | ✅ | `Venue.cateringPackages` | ✅ |
| `menuPackage` | ✅ | `Venue.menuPackage` | ✅ |
| `features` | ✅ | `Venue.features` | ✅ |
| `faqs` | ✅ | `Venue.faqs` | ✅ |
| `images` | ✅ | `Venue.images` | ✅ |
| `blockedDates` | ✅ | `Venue.blockedDates` | ✅ |
| `blackoutDates` | ✅ | `Venue.blackoutDates` | ✅ |
| `bookedDates` | ✅ | `Venue.bookedDates` | ✅ |
| `operatingHours` | ✅ | `VenueOperatingHours` | ✅ |
| `dayOverrides` | ✅ | `Venue.dayOverrides` | ✅ |
| `serviceActive` | ✅ | `Venue.serviceActive` | ✅ |
| `ownerId` | ✅ | `Venue.ownerId` | ✅ |
| `borrowHub` | ✅ | `Venue.borrowHub` | ✅ |
| `borrowableInventory` | ✅ | `Venue.borrowableInventory` | ✅ |
| `reviews` | ✅ | `Venue.reviews` | ✅ |
| `website` | ✅ | `Venue.website` | ✅ |

---

## INDEXES

The web app uses `firestore.indexes.json` with composite indexes for:
- `borrow_requests`: `lenderVenueId` + `createdAt`, `borrowerVenueId` + `createdAt`
- `inventory_listings`: `isActive`
- `chats`: `venueSlug` + `lastMessageTimestamp`

Flutter queries use the same index patterns and are compatible with the same Firestore index configuration.
