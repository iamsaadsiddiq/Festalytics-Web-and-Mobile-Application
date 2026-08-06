# Festalytics Mobile Final Parity Pass

This build was patched from `festalytics-mobile-frontend-workflow-updated.zip` and targets the explicit defects that were identified in the last comparison.

## What was changed

### 1. Export-only stubs removed
- All generated Dart files that were only `export ... app_core.dart` wrappers were replaced with concrete Flutter widget files.
- Current status: 0 `export app_core.dart` mirror stubs remain.
- The app still uses shared route/service infrastructure, but the mapped web files now contain actual Flutter widget classes instead of export-only files.

### 2. Centralized UI reduced by adding feature-specific pages
Added a final parity layer in `lib/src/ui_parity_pages.dart`:
- `FinalAboutPage`
- `FinalEditEventPage`
- `FinalServiceDiscoveryPage`
- `FinalVendorBookingsPage`
- `FinalVendorServicesHubPage`
- `FinalVendorAvailabilityWorkspacePage`
- `FinalVendorMessagesPage`
- `FinalVendorSettingsPage`

### 3. Edit event route added
- Added `/edit-event/[id]` style routing.
- Manage Event now includes an Edit Event action.
- Edit Event updates the same Firestore `events/{eventId}` document.

### 4. About page cloned beyond placeholder
- Replaced the simple About page with a full mobile About flow.
- Added platform explanation, user workflow, vendor workflow and CTA sections.

### 5. Service Discovery upgraded
- Added search, area and category filters.
- Added map/location preview panel with venue markers.
- Added Google Maps directions launch action.
- Added live venue/vendor cards from Firestore `venues`.

### 6. Vendor bookings upgraded
- Added requests, confirmed bookings, counter offers and proof/calls tabs.
- Added search and status filtering.
- Added stats/metric pills.
- Added detail drawer with full JSON request and Twilio AI call panel.
- Added counter offer action.
- Added proof/calls tab and receiver registration action.
- Preserved Firestore quotation and booking integrations.

### 7. Vendor services upgraded
- Added service listing hub.
- Added service package cards.
- Added create/edit service routes.
- Kept service wizard for pricing, packages, gallery, features, FAQs and active status.

### 8. Availability upgraded
- Added calendar workspace route.
- Added day panel.
- Added block/unblock per day.
- Added operating hours and day override publish controls.

### 9. Messages upgraded
- Added vendor inbox/sidebar style layout.
- Added compose dialog.
- Added quick reply chips.
- Added counter offer summary widget.
- Kept Firestore chat message stream and send message integration.

### 10. Settings upgraded
- Added separate routing for:
  - Account
  - Business
  - Security
  - Notifications
  - Payments
  - Help
- Account and Business use Firestore update flows.
- Security uses Firebase password reset.

### 11. Navigation/back flow improved
- Vendor drawer navigation now uses replacement routing instead of endlessly stacking vendor routes.

## Important runtime note
I could not run `flutter run` in this environment because Flutter/Dart SDK is not installed in the sandbox. The code was patched textually and packaged. Run locally with:

```powershell
cd D:\festalytics-app-full-clone
flutter clean
flutter pub get
flutter run --dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001
```

Backend must be running separately from:

```powershell
cd D:\festalytics-app-full-clone\backend
python -m uvicorn app.main:app --reload --env-file ..\.env --host 0.0.0.0 --port 8001
```

For AI calling, ngrok is still required because Twilio must reach the local backend through a public HTTPS URL.
