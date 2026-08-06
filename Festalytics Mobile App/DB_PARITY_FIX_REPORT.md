# DB Parity Fix Report

This build patches the latest generated mobile project with the DB flows that were previously audited as missing or partial.

## Added / upgraded Firestore parity

### Auth/profile
- Role-based login/signup is preserved.
- User profile update now writes to `users/{uid}` fields used by web: `fullName`, `name`, `mobileNumber`, `phone`, `bio`, `updatedAt`.
- Vendor onboarding now creates a more complete `venues/{venueSlug}` document with fields used by the web dashboard: `profile`, `pricing`, `cateringPackages`, `menuPackage`, `features`, `faqs`, `images`, `blockedDates`, `blackoutDates`, `bookedDates`, `operatingHours`, `dayOverrides`, `serviceActive`, `borrowHub`, `borrowableInventory`, `ownerId`, `categories`, `website`, and timestamps.

### User events
- `/create-event` now writes a fuller Firestore document to `events` with event details, budget, planning block, source, timestamps, and user ownership.
- `/manage-event/[id]` now reads `events/{eventId}` and linked user quotations/chats.

### Quotations / bookings
- Customer quote creation now writes web-compatible `quotations` records.
- Vendor bookings now reads `quotations` and `bookings` separately.
- Accept/reject and AI call decision updates patch `quotations/{id}`.
- Added walk-in booking form that writes to `bookings` using the web ERP-style structure.

### Vendor-to-vendor Borrow Hub
- Added `venues/{venueId}.borrowableInventory` CRUD.
- Added sync to root `inventory_listings` collection.
- Added network participation and publish flow.
- Added Borrow Hub discovery listing stream with filters matching web logic.
- Added `borrow_requests` create/incoming/outgoing streams.
- Added accept, decline, cancel, mark in-use, and mark returned flows.
- Added transaction-based stock decrement/restore for accept/return.

### Vendor services/settings/availability
- Added My Services editor for `description`, `pricing`, `cateringPackages`, `menuPackage`, `features`, `faqs`, `images`, `serviceActive`.
- Added Availability editor for `blockedDates`, `blackoutDates`, `bookedDates`, `operatingHours`, and `dayOverrides`.
- Added Business Settings editor for `venues/{venueId}` business fields.

### Messages/chats
- Added vendor inbox stream from `chats` where `venueSlug == venueId`.
- Added customer inbox stream from `chats` where `customerId == uid`.
- Added `chats/{chatId}/messages` stream.
- Added send message and unread counter updates.
- Added archive/read helper methods.

### Service discovery / services
- Replaced placeholder service-discovery screens with live `venues` collection streams.

## Important runtime dependencies
- Firestore security rules must allow the same reads/writes as the web app for the authenticated role.
- Composite indexes may be needed if your Firestore rules/indexes differ; this mobile version intentionally avoids most multi-order queries to reduce index errors.
- Backend AI/Twilio routes still require the backend process to be running. Twilio automated calling still requires a public HTTPS `PUBLIC_BASE_URL` such as ngrok.

## Files changed
- `lib/src/app_core.dart`
- `lib/src/db_feature_pages.dart`
- `DB_PARITY_FIX_REPORT.md`
