# Front-end / UI / Workflow parity upgrade

This build applies the front-end/workflow defects identified in the comparative review of the previous zip.

## Replaced routing targets
The router in `lib/src/app_core.dart` now points the main web-equivalent routes to richer mobile pages in `lib/src/ui_parity_pages.dart`:

- `/` -> `ParityHomePage`
- `/user-dashboard` -> `ParityUserDashboardPage`
- `/all-venues` -> `ParityAllVenuesPage`
- `/venue/[id]` -> `ParityVenueDetailsPage`
- `/create-event` -> `ParityCreateEventWizardPage`
- `/my-events` -> `ParityMyEventsPage`
- `/manage-event/[eventId]` -> `ParityManageEventPage`
- `/service-discovery` -> `ParityServiceDiscoveryPage`
- `/vendor-dashboard` -> `ParityVendorDashboardPage`
- `/vendor-dashboard/bookings` -> `ParityVendorBookingsPage`
- `/vendor-dashboard/availability` -> `ParityVendorAvailabilityPage`
- `/vendor-dashboard/my-services` -> `ParityVendorServicesPage`
- `/vendor-dashboard/my-inventory` -> `ParityVendorInventoryPage`
- `/vendor-dashboard/borrow-hub` -> `ParityBorrowHubPage`
- `/vendor-dashboard/messages` -> `ParityVendorMessagesPage`
- `/vendor-dashboard/settings/*` -> `ParitySettingsPage`

## Implemented UI/workflow gaps

### Landing page
- Added web-like hero section.
- Added location/event/guest search form.
- Search passes filters to All Venues.
- Added role-based login/signup CTAs.
- Added AI Planner, Find Decor, Service Discovery, Vendor Portal entry points.

### All Venues
- Added search, location, event type and guest count filters.
- Added dynamic venue cards with image, city, capacity and pricing chips.
- Venue cards route to `/venue/[id]`.

### Venue Details
- Added hero, gallery, overview, packages/pricing, availability preview, features and FAQs.
- Added protected quotation request sheet.
- Quotation payload stores menu, addons, customer info and financials.
- Added message action creating/reusing Firestore chat room.

### Create Event
- Replaced single form with a multi-step wizard:
  1. Basic details
  2. Budget
  3. Venue selection
  4. Vendors
  5. Timeline/checklist
  6. Review/save
- Saves richer event planning payload to Firestore.

### My Events / Manage Event
- Added event cards and manage buttons.
- Added Manage Event workspace with tabs for overview, budget, timeline, quotations and messages.
- Timeline/checklist editing writes back to Firestore.

### User Dashboard
- Added hero, event/quotation metrics, quick actions and recent events.

### Service Discovery
- Added live Firestore vendor/venue filtering and map-like preview panel.

### Vendor Dashboard
- Added hero, live metrics, module action cards and venue context.

### Vendor Bookings
- Added web-like tabs for quotations, bookings and walk-ins.
- Added filters and stats on quotation requests.
- Preserved AI confirmation call panel.

### Vendor Availability
- Added calendar-style monthly grid.
- Tap date to block/unblock and write availability to venue document.

### Vendor My Services
- Replaced raw placeholder with a multi-step services wizard:
  1. Overview
  2. Pricing
  3. Gallery/features/FAQs
  4. Review/publish
- Saves pricing, catering packages, features, FAQs, images and service status.

### Settings
- Added security, notifications, payments and help routes instead of mapping every setting route to one generic form.

### Back navigation/lifecycle
- The new pages avoid timer-heavy/dialog-heavy startup flows and route through normal Navigator pages.
- AI call polling still cancels timers in the existing `TwilioCallPanel.dispose()`.

## Important runtime note
This environment still cannot run Flutter SDK commands, so `flutter run` must be executed on your machine. The files were patched for the current project, but compile/runtime verification still has to happen locally.
