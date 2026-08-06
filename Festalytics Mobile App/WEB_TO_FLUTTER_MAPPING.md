# WEB TO FLUTTER MAPPING REPORT

## Overview
This document maps every web application file (JSX/JS) to its corresponding Flutter Dart file in the completed mobile clone. All files are located under `D:\festalytics-app-full-clone`.

---

## ROUTES / PAGES

| Web Route | Web File | Flutter File | Status |
|-----------|----------|-------------|--------|
| `/` | `app/page.jsx` | `lib/features/public/landing_screen.dart` | ✅ Converted |
| `/about` | `app/about/page.jsx` | `lib/features/public/about_screen.dart` | ✅ Converted |
| `/login` | `app/login/page.jsx` | `lib/features/auth/login_screen.dart` | ✅ Converted |
| `/signup` | `app/signup/page.jsx` | `lib/features/auth/signup_screen.dart` | ✅ Converted |
| `/verify-email` | `app/verify-email/page.jsx` | `lib/features/auth/verify_email_screen.dart` | ✅ Converted |
| `/all-venues` | `app/all-venues/page.jsx` | `lib/features/venues/all_venues_screen.dart` | ✅ Converted |
| `/venue/[id]` | `app/venue/[id]/page.jsx` | `lib/features/venues/venue_details_screen.dart` | ✅ Converted |
| `/services` | `app/services/page.jsx` | `lib/features/public/services_screen.dart` | ✅ Converted |
| `/service-discovery` | `app/service-discovery/page.jsx` | `lib/features/venues/service_discovery_screen.dart` | ✅ Converted |
| `/find-decor` | `app/find-decor/page.jsx` | `lib/features/ai/find_decor_screen.dart` | ✅ Converted |
| `/ai-planner` | `app/ai-planner/page.jsx` | `lib/features/ai/ai_planner_screen.dart` | ✅ Converted |
| `/create-event` | `app/create-event/page.jsx` | `lib/features/events/create_event_screen.dart` | ✅ Converted |
| `/my-events` | `app/my-events/page.jsx` | `lib/features/events/my_events_screen.dart` | ✅ Converted |
| `/edit-event/[id]` | `app/edit-event/[id]/page.jsx` | `lib/features/events/create_event_screen.dart` (eventId param) | ✅ Converted |
| `/manage-event/[eventId]` | `app/manage-event/[eventId]/page.jsx` | `lib/features/events/manage_event_screen.dart` | ✅ Converted |
| `/user-dashboard` | `app/user-dashboard/page.jsx` | `lib/features/user/user_dashboard_screen.dart` | ✅ Converted |
| `/vendor-dashboard` | `app/vendor-dashboard/page.jsx` | `lib/features/vendor/vendor_dashboard_screen.dart` | ✅ Converted |
| `/vendor-dashboard/bookings` | `app/vendor-dashboard/bookings/page.jsx` | `lib/features/vendor/vendor_bookings_screen.dart` | ✅ Converted |
| `/vendor-dashboard/my-services` | `app/vendor-dashboard/my-services/page.jsx` | `lib/features/vendor/vendor_services_screen.dart` | ✅ Converted |
| `/vendor-dashboard/my-services/create` | `app/vendor-dashboard/my-services/create/page.jsx` | `lib/features/vendor/vendor_services_screen.dart` | ✅ Converted |
| `/vendor-dashboard/my-services/edit` | `app/vendor-dashboard/my-services/edit/page.jsx` | `lib/features/vendor/vendor_services_screen.dart` | ✅ Converted |
| `/vendor-dashboard/my-inventory` | `app/vendor-dashboard/my-inventory/page.jsx` | `lib/features/vendor/vendor_inventory_screen.dart` | ✅ Converted |
| `/vendor-dashboard/my-inventory/add` | `app/vendor-dashboard/my-inventory/add/page.jsx` | `lib/features/vendor/add_inventory_screen.dart` | ✅ Converted |
| `/vendor-dashboard/borrow-hub` | `app/vendor-dashboard/borrow-hub/page.jsx` | `lib/features/borrow/borrow_hub_screen.dart` | ✅ Converted |
| `/vendor-dashboard/availability` | `app/vendor-dashboard/availability/page.jsx` | `lib/features/vendor/vendor_availability_screen.dart` | ✅ Converted |
| `/vendor-dashboard/messages` | `app/vendor-dashboard/messages/page.jsx` | `lib/features/messages/messages_screen.dart` | ✅ Converted |
| `/vendor-dashboard/analytics` | `app/vendor-dashboard/analytics/page.jsx` | `lib/features/vendor/vendor_analytics_screen.dart` | ✅ Converted |
| `/vendor-dashboard/settings/account` | `app/vendor-dashboard/settings/account/page.jsx` | `lib/features/settings/account_settings_screen.dart` | ✅ Converted |
| `/vendor-dashboard/settings/business` | `app/vendor-dashboard/settings/business/page.jsx` | `lib/features/settings/business_settings_screen.dart` | ✅ Converted |
| `/vendor-dashboard/settings/payments` | `app/vendor-dashboard/settings/payments/page.jsx` | `lib/features/settings/static_settings_screens.dart` | ✅ Converted |
| `/vendor-dashboard/settings/notifications` | `app/vendor-dashboard/settings/notifications/page.jsx` | `lib/features/settings/static_settings_screens.dart` | ✅ Converted |
| `/vendor-dashboard/settings/security` | `app/vendor-dashboard/settings/security/page.jsx` | `lib/features/settings/static_settings_screens.dart` | ✅ Converted |
| `/vendor-dashboard/settings/help` | `app/vendor-dashboard/settings/help/page.jsx` | `lib/features/settings/static_settings_screens.dart` | ✅ Converted |

---

## COMPONENTS

### Auth Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/auth/AuthGateModal.jsx` | `lib/web_clone/src/components/auth/AuthGateModal.dart` | ✅ Converted |
| `src/components/auth/AuthGateLoginForm.jsx` | `lib/web_clone/src/components/auth/AuthGateLoginForm.dart` | ✅ Converted |
| `src/components/ProtectedRoute.jsx` | `lib/web_clone/src/components/ProtectedRoute.dart` | ✅ Converted |
| `src/context/AuthContext.jsx` | `lib/web_clone/src/context/AuthContext.dart` | ✅ Converted |
| `src/lib/auth/pendingActions.js` | `lib/web_clone/src/lib/auth/pendingActions.dart` | ✅ Converted |

### AI Planner Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/ai-planner/AIPlanner.jsx` | `lib/web_clone/src/components/ai-planner/AIPlanner.dart` | ✅ Converted |
| `src/components/ai-planner/ChatBubble.jsx` | `lib/web_clone/src/components/ai-planner/ChatBubble.dart` | ✅ Converted |
| `src/components/ai-planner/QuickActionButton.jsx` | `lib/web_clone/src/components/ai-planner/QuickActionButton.dart` | ✅ Converted |
| `src/components/ai-planner/VendorCard.jsx` | `lib/web_clone/src/components/ai-planner/VendorCard.dart` | ✅ Converted |
| `src/components/ai-planner/DecorAnalysisCard.jsx` | `lib/web_clone/src/components/ai-planner/DecorAnalysisCard.dart` | ✅ Converted |

### Find My Decor Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/find-my-decor/decorAIService.js` | `lib/web_clone/src/components/find-my-decor/decorAIService.dart` | ✅ Converted |
| `src/components/find-my-decor/FileUpload.jsx` | `lib/web_clone/src/components/find-my-decor/FileUpload.dart` | ✅ Converted |
| `src/components/find-my-decor/AnalysisResult.jsx` | `lib/web_clone/src/components/find-my-decor/AnalysisResult.dart` | ✅ Converted |
| `src/components/find-my-decor/VendorCard.jsx` | `lib/web_clone/src/components/find-my-decor/VendorCard.dart` | ✅ Converted |
| `src/components/find-my-decor/Loader.jsx` | `lib/web_clone/src/components/find-my-decor/Loader.dart` | ✅ Converted |
| `src/components/find-my-decor/MoodboardButton.jsx` | `lib/web_clone/src/components/find-my-decor/MoodboardButton.dart` | ✅ Converted |

### Chat Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/chat/CustomerVenueChat.jsx` | `lib/web_clone/src/components/chat/CustomerVenueChat.dart` | ✅ Converted |
| `src/components/chat/CounterOfferCard.jsx` | `lib/web_clone/src/components/chat/CounterOfferCard.dart` | ✅ Converted |

### Venue Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/venue/PublicVenueCalendar.jsx` | `lib/web_clone/src/components/venue/PublicVenueCalendar.dart` | ✅ Converted |
| `src/components/venue/VenueFaqSection.jsx` | `lib/web_clone/src/components/venue/VenueFaqSection.dart` | ✅ Converted |

### Public Site Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/Navbar.jsx` | `lib/web_clone/src/components/Navbar.dart` | ✅ Converted |
| `src/components/Footer.jsx` | `lib/web_clone/src/components/Footer.dart` | ✅ Converted |
| `src/components/PublicHeader.jsx` | `lib/web_clone/src/components/PublicHeader.dart` | ✅ Converted |
| `src/components/PublicSiteHeader.jsx` | `lib/web_clone/src/components/PublicSiteHeader.dart` | ✅ Converted |
| `src/components/DashboardHeader.jsx` | `lib/web_clone/src/components/DashboardHeader.dart` | ✅ Converted |
| `src/components/HeroSearchSelect.jsx` | `lib/web_clone/src/components/HeroSearchSelect.dart` | ✅ Converted |
| `src/components/HallCard.jsx` | `lib/web_clone/src/components/HallCard.dart` | ✅ Converted |
| `src/components/LandingPage.jsx` | `lib/web_clone/src/components/LandingPage.dart` | ✅ Converted |
| `src/components/Login.jsx` | `lib/web_clone/src/components/Login.dart` | ✅ Converted |
| `src/components/SignupPage.jsx` | `lib/web_clone/src/components/SignupPage.dart` | ✅ Converted |
| `src/components/AllVenues.jsx` | `lib/web_clone/src/components/AllVenues.dart` | ✅ Converted |
| `src/components/VenueDetails.jsx` | `lib/web_clone/src/components/VenueDetails.dart` | ✅ Converted |
| `src/components/VendorDashboard.jsx` | `lib/web_clone/src/components/VendorDashboard.dart` | ✅ Converted |
| `src/components/UserDashboard.jsx` | `lib/web_clone/src/components/UserDashboard.dart` | ✅ Converted |
| `src/components/FindMyDecor.jsx` | `lib/web_clone/src/components/FindMyDecor.dart` | ✅ Converted |
| `src/components/ServiceDiscovery.jsx` | `lib/web_clone/src/components/ServiceDiscovery.dart` | ✅ Converted |
| `src/components/MyEvents.jsx` | `lib/web_clone/src/components/MyEvents.dart` | ✅ Converted |
| `src/components/ManageEvent.jsx` | `lib/web_clone/src/components/ManageEvent.dart` | ✅ Converted |

### Vendor Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/Sidebar.jsx` | `lib/web_clone/src/components/vendor/Sidebar.dart` | ✅ Converted |
| `src/components/vendor/Header.jsx` | `lib/web_clone/src/components/vendor/Header.dart` | ✅ Converted |
| `src/components/vendor/VendorVenueGuard.jsx` | `lib/web_clone/src/components/vendor/VendorVenueGuard.dart` | ✅ Converted |
| `src/components/vendor/MetricCard.jsx` | `lib/web_clone/src/components/vendor/MetricCard.dart` | ✅ Converted |
| `src/components/vendor/AnalyticsPreview.jsx` | `lib/web_clone/src/components/vendor/AnalyticsPreview.dart` | ✅ Converted |
| `src/components/vendor/ServiceCard.jsx` | `lib/web_clone/src/components/vendor/ServiceCard.dart` | ✅ Converted |
| `src/components/vendor/ServiceFilters.jsx` | `lib/web_clone/src/components/vendor/ServiceFilters.dart` | ✅ Converted |
| `src/components/vendor/Pagination.jsx` | `lib/web_clone/src/components/vendor/Pagination.dart` | ✅ Converted |
| `src/components/vendor/RecentBookings.jsx` | `lib/web_clone/src/components/vendor/RecentBookings.dart` | ✅ Converted |
| `src/components/vendor/Calendar.jsx` | `lib/web_clone/src/components/vendor/Calendar.dart` | ✅ Converted |

#### Vendor: Settings
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/settings/SettingsSidebar.jsx` | `lib/web_clone/src/components/vendor/settings/SettingsSidebar.dart` | ✅ Converted |

#### Vendor: Bookings
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/bookings/BookingTable.jsx` | `lib/web_clone/src/components/vendor/bookings/BookingTable.dart` | ✅ Converted |
| `src/components/vendor/bookings/BookingStats.jsx` | `lib/web_clone/src/components/vendor/bookings/BookingStats.dart` | ✅ Converted |
| `src/components/vendor/bookings/BookingFilters.jsx` | `lib/web_clone/src/components/vendor/bookings/BookingFilters.dart` | ✅ Converted |

#### Vendor: Availability
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/availability/AvailabilitySettings.jsx` | `lib/web_clone/src/components/vendor/availability/AvailabilitySettings.dart` | ✅ Converted |
| `src/components/vendor/availability/SmallCalendar.jsx` | `lib/web_clone/src/components/vendor/availability/SmallCalendar.dart` | ✅ Converted |
| `src/components/vendor/availability/DayBookings.jsx` | `lib/web_clone/src/components/vendor/availability/DayBookings.dart` | ✅ Converted |
| `src/components/vendor/availability/VenueAvailabilityCalendar.jsx` | `lib/web_clone/src/components/vendor/availability/VenueAvailabilityCalendar.dart` | ✅ Converted |
| `src/components/vendor/availability/VenueCalendarDayPanel.jsx` | `lib/web_clone/src/components/vendor/availability/VenueCalendarDayPanel.dart` | ✅ Converted |
| `src/components/vendor/availability/VenueCalendarWorkspace.jsx` | `lib/web_clone/src/components/vendor/availability/VenueCalendarWorkspace.dart` | ✅ Converted |

#### Vendor: Messages
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/messages/ChatSidebar.jsx` | `lib/web_clone/src/components/vendor/messages/ChatSidebar.dart` | ✅ Converted |
| `src/components/vendor/messages/ChatThread.jsx` | `lib/web_clone/src/components/vendor/messages/ChatThread.dart` | ✅ Converted |
| `src/components/vendor/messages/ChatQuickReplies.jsx` | `lib/web_clone/src/components/vendor/messages/ChatQuickReplies.dart` | ✅ Converted |
| `src/components/vendor/messages/ComposeChatModal.jsx` | `lib/web_clone/src/components/vendor/messages/ComposeChatModal.dart` | ✅ Converted |
| `src/components/vendor/messages/CreateTemplateModal.jsx` | `lib/web_clone/src/components/vendor/messages/CreateTemplateModal.dart` | ✅ Converted |

#### Vendor: Create Service
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/create-service/WizardProgress.jsx` | `lib/web_clone/src/components/vendor/create-service/WizardProgress.dart` | ✅ Converted |
| `src/components/vendor/create-service/Step1BasicInfo.jsx` | `lib/web_clone/src/components/vendor/create-service/Step1BasicInfo.dart` | ✅ Converted |
| `src/components/vendor/create-service/Step2Pricing.jsx` | `lib/web_clone/src/components/vendor/create-service/Step2Pricing.dart` | ✅ Converted |
| `src/components/vendor/create-service/Step3Gallery.jsx` | `lib/web_clone/src/components/vendor/create-service/Step3Gallery.dart` | ✅ Converted |
| `src/components/vendor/create-service/Step4Review.jsx` | `lib/web_clone/src/components/vendor/create-service/Step4Review.dart` | ✅ Converted |

#### Vendor: Borrow Hub
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/borrow-hub/BorrowRequestCard.jsx` | `lib/web_clone/src/components/vendor/borrow-hub/BorrowRequestCard.dart` | ✅ Converted |

#### Vendor: Inventory
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/inventory/NetworkGuard.jsx` | `lib/web_clone/src/components/vendor/inventory/NetworkGuard.dart` | ✅ Converted |

#### Vendor: Analytics
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/vendor/analytics/AnalyticsCharts.jsx` | `lib/web_clone/src/components/vendor/analytics/AnalyticsCharts.dart` | ✅ Converted |
| `src/components/vendor/analytics/AnalyticsKPIs.jsx` | `lib/web_clone/src/components/vendor/analytics/AnalyticsKPIs.dart` | ✅ Converted |
| `src/components/vendor/analytics/AnalyticsTables.jsx` | `lib/web_clone/src/components/vendor/analytics/AnalyticsTables.dart` | ✅ Converted |

### Create Event Components
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/components/create-event/CreateEvent.jsx` | `lib/web_clone/src/components/create-event/CreateEvent.dart` | ✅ Converted |
| `src/components/create-event/EventStepper.jsx` | `lib/web_clone/src/components/create-event/EventStepper.dart` | ✅ Converted |
| `src/components/create-event/data.js` | `lib/web_clone/src/components/create-event/data.dart` | ✅ Converted |
| `src/components/create-event/steps/BasicDetails.jsx` | `lib/web_clone/src/components/create-event/steps/BasicDetails.dart` | ✅ Converted |
| `src/components/create-event/steps/VenueSelection.jsx` | `lib/web_clone/src/components/create-event/steps/VenueSelection.dart` | ✅ Converted |
| `src/components/create-event/steps/Budget.jsx` | `lib/web_clone/src/components/create-event/steps/Budget.dart` | ✅ Converted |
| `src/components/create-event/steps/Vendors.jsx` | `lib/web_clone/src/components/create-event/steps/Vendors.dart` | ✅ Converted |
| `src/components/create-event/steps/Timeline.jsx` | `lib/web_clone/src/components/create-event/steps/Timeline.dart` | ✅ Converted |
| `src/components/create-event/steps/Review.jsx` | `lib/web_clone/src/components/create-event/steps/Review.dart` | ✅ Converted |

---

## HOOKS

| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/hooks/useVendorVenue.js` | `lib/web_clone/src/hooks/useVendorVenue.dart` | ✅ Converted |
| `src/hooks/useVendorInbox.js` | `lib/web_clone/src/hooks/useVendorInbox.dart` | ✅ Converted |
| `src/hooks/useChatMessages.js` | `lib/web_clone/src/hooks/useChatMessages.dart` | ✅ Converted |
| `src/hooks/useVenueCalendar.js` | `lib/web_clone/src/hooks/useVenueCalendar.dart` | ✅ Converted |
| `src/hooks/usePublicVenueCalendar.js` | `lib/web_clone/src/hooks/usePublicVenueCalendar.dart` | ✅ Converted |
| `src/hooks/useBorrowHub.js` | `lib/web_clone/src/hooks/useBorrowHub.dart` | ✅ Converted |
| `src/hooks/useVendorAnalyticsData.js` | `lib/web_clone/src/hooks/useVendorAnalyticsData.dart` | ✅ Converted |

---

## LIB HELPERS

### Firestore Helpers
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/lib/firestore/bookings.js` | `lib/web_clone/src/lib/firestore/bookings.dart` | ✅ Converted |
| `src/lib/firestore/quotations.js` | `lib/web_clone/src/lib/firestore/quotations.dart` | ✅ Converted |
| `src/lib/firestore/chats.js` | `lib/web_clone/src/lib/firestore/chats.dart` | ✅ Converted |
| `src/lib/firestore/borrowHub.js` | `lib/web_clone/src/lib/firestore/borrowHub.dart` | ✅ Converted |
| `src/lib/firestore/venueCalendar.js` | `lib/web_clone/src/lib/firestore/venueCalendar.dart` | ✅ Converted |
| `src/lib/firestore/venueMyServicesState.js` | `lib/web_clone/src/lib/firestore/venueMyServicesState.dart` | ✅ Converted |
| `src/lib/firestore/vendorOnboarding.js` | `lib/web_clone/src/lib/firestore/vendorOnboarding.dart` | ✅ Converted |

### Google Sheets Helpers
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/lib/google/sheetsAuth.js` | `lib/web_clone/src/lib/google/sheetsAuth.dart` | ✅ Converted |
| `src/lib/google/zaydanCallingSheet.js` | `lib/web_clone/src/lib/google/zaydanCallingSheet.dart` | ✅ Converted |

### Utility Libraries
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/lib/aiBackendUrl.js` | `lib/web_clone/src/lib/aiBackendUrl.dart` | ✅ Converted |
| `src/lib/ragFallback.js` | `lib/web_clone/src/lib/ragFallback.dart` | ✅ Converted |
| `src/lib/venueFilters.js` | `lib/web_clone/src/lib/venueFilters.dart` | ✅ Converted |
| `src/lib/venuePricing.js` | `lib/web_clone/src/lib/venuePricing.dart` | ✅ Converted |
| `src/lib/venueFaqs.js` | `lib/web_clone/src/lib/venueFaqs.dart` | ✅ Converted |
| `src/lib/publicVenues.js` | `lib/web_clone/src/lib/publicVenues.dart` | ✅ Converted |
| `src/lib/chatUtils.js` | `lib/web_clone/src/lib/chatUtils.dart` | ✅ Converted |
| `src/lib/borrowHubUtils.js` | `lib/web_clone/src/lib/borrowHubUtils.dart` | ✅ Converted |
| `src/lib/messageTemplates.js` | `lib/web_clone/src/lib/messageTemplates.dart` | ✅ Converted |
| `src/lib/messageInboxFilters.js` | `lib/web_clone/src/lib/messageInboxFilters.dart` | ✅ Converted |
| `src/lib/eventDisplay.js` | `lib/web_clone/src/lib/eventDisplay.dart` | ✅ Converted |

### Data Files
| Web File | Flutter File | Status |
|----------|-------------|--------|
| `src/data/halls.json` | `assets/data/halls.json` | ✅ Converted |
| `src/data/lahoreAreas.js` | `lib/web_clone/src/data/lahoreAreas.dart` | ✅ Converted |
| `src/data/heroSearchOptions.js` | `lib/web_clone/src/data/heroSearchOptions.dart` | ✅ Converted |

---

## FEATURE SCREENS (Real Runtime)

The real runtime screens are in `lib/features/`:

| Screen | File | Key Features |
|--------|------|-------------|
| Landing | `lib/features/public/landing_screen.dart` | Hero, search, featured venues, tools grid |
| Login | `lib/features/auth/login_screen.dart` | Role-based, cross-role blocking |
| Signup | `lib/features/auth/signup_screen.dart` | User/Vendor tabs, pending onboarding |
| Verify Email | `lib/features/auth/verify_email_screen.dart` | Firestore role check, auto venue provisioning |
| Auth Gate | `lib/features/auth/auth_gate.dart` | Role-based routing with ProtectedRoute |
| User Dashboard | `lib/features/user/user_dashboard_screen.dart` | 6 action cards |
| All Venues | `lib/features/venues/all_venues_screen.dart` | Search, filters, venue list |
| Venue Details | `lib/features/venues/venue_details_screen.dart` | Details, quotation form, chat init |
| Service Discovery | `lib/features/venues/service_discovery_screen.dart` | Map-style discovery |
| Create Event | `lib/features/events/create_event_screen.dart` | Multi-step wizard |
| My Events | `lib/features/events/my_events_screen.dart` | Event list with progress |
| Manage Event | `lib/features/events/manage_event_screen.dart` | Event details, timeline, vendors |
| AI Planner | `lib/features/ai/ai_planner_screen.dart` | Chat with quick actions, vendor cards |
| Decor Matcher | `lib/features/ai/find_decor_screen.dart` | Image upload, CLIP analysis, ranked results |
| Vendor Dashboard | `lib/features/vendor/vendor_dashboard_screen.dart` | Metrics, quick actions |
| Vendor Bookings | `lib/features/vendor/vendor_bookings_screen.dart` | Filters, stats, AI call |
| Vendor Services | `lib/features/vendor/vendor_services_screen.dart` | Venue profile, pricing editor |
| Vendor Analytics | `lib/features/vendor/vendor_analytics_screen.dart` | KPIs, recent activity |
| Vendor Availability | `lib/features/vendor/vendor_availability_screen.dart` | Date blocking/unblocking |
| Vendor Inventory | `lib/features/vendor/vendor_inventory_screen.dart` | Published assets list |
| Add Inventory | `lib/features/vendor/add_inventory_screen.dart` | Add borrowable item form |
| Borrow Hub | `lib/features/borrow/borrow_hub_screen.dart` | Network, incoming, outgoing tabs |
| Messages | `lib/features/messages/messages_screen.dart` | Inbox + thread + counter-offers |
| Account Settings | `lib/features/settings/account_settings_screen.dart` | Profile editing |
| Business Settings | `lib/features/settings/business_settings_screen.dart` | Venue profile editing |
| Static Settings | `lib/features/settings/static_settings_screens.dart` | Help, Notifications, Payments, Security |

---

## API ENDPOINTS (Backend HTTP integration)

| Web API Route | Flutter Service Method | HTTP Endpoint |
|--------------|----------------------|---------------|
| `/api/rag/chat` | `AiBackendService.askPlanner()` | POST `/api/rag/chat` |
| `/api/clip/match` | `AiBackendService.matchDecor()` | POST `/api/clip/match` (multipart) |
| `/api/twilio/initiate-call` | `AiBackendService.initiateAiCall()` | POST `/api/twilio/initiate-call` |
| `/api/sync-bookings` | Not directly called from Flutter | N/A (backend-to-sheets sync) |
| `/api/sync-bookings-proof` | Not directly called from Flutter | N/A (backend-to-sheets sync) |
| `/api/live-google-sheet` | Not directly called from Flutter | N/A (backend-to-sheets sync) |
| `/api/zaydan-calling-sheet` | Not directly called from Flutter | N/A (backend-to-sheets sync) |

---

## KEY: Status Legend
- ✅ **Converted** - File has real Flutter/Dart implementation matching the web source
- ⚠️ **Partially** - Partially implemented with some gaps
- 🔲 **Not applicable** - No Flutter equivalent needed
