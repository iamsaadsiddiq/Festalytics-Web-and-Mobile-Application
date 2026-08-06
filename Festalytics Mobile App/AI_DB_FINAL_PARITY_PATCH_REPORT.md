# AI + Database Final Parity Patch Report

This patch adds the AI/DB parity items that were identified as missing in the prior examination.

## AI modules

### AI Planner / Chatbot
- Continues to use the same backend RAG endpoint: `/api/rag/chat`.
- Keeps response parsing for `reply`, hall matches, exact match metadata, and backend result cards.

### AI Decor Matching
- Continues to use the same CLIP endpoint: `/api/clip/match`.
- Keeps multipart file field as `image`.
- Keeps rejected/irrelevant-image handling using backend `rejected`, `subject`, and `detail` fields.

### AI Automated Calling
- Keeps `/mobile.html` receiver registration.
- Keeps `/api/twilio/booking-info` state updates and polling.
- Keeps `/api/twilio/initiate-call` call start flow.
- Stores proof fields consistently on quotations: `proofUrl`, `voiceProofUrl`, `proof`, `aiCall`, `twilio`, `twilioDecision`, and `callStatus`.
- Adds proof sync call to `/api/sync-bookings-proof` when proof is available.
- Adds proof list UI actions to play/open recording and sync proof.
- Adds Google Sheet sync dialog actions for `/api/sync-bookings`, `/api/live-google-sheet`, and `/api/zaydan-calling-sheet`.

## Database parity additions

### Vendors collection support
- Service Discovery now merges live records from both `venues` and `vendors` collections.
- If `vendors` is not present or rules deny access, venues continue working.

### Vendor onboarding fallback
- Adds existing venue resolution by `users/{uid}.venueId`, `venues.ownerId`, matching `hallName`, and legacy Zaydan fallback.
- Auth refresh now tries to resolve a missing vendor venue automatically.
- Vendor provisioning now links to existing owned/unowned matching venue before creating a duplicate.

### Borrow Hub parity helpers
- Adds web-style helper equivalents:
  - `fetchVenueInventorySnapshot`
  - `publishBorrowHubCatalog`
  - `appendBorrowableInventoryItem`
  - `saveBorrowHubSettings`
  - `syncInventoryListings`
- Existing request transitions remain: create, accept, decline, cancel, mark in-use, returned/settled.

### Chat/counter-offer parity
- Adds `respondToCounterOffer`.
- Chat dialog now renders counter-offer cards and customer accept/decline actions.
- Compose chat now uses `ensureChatRoom` so the parent `chats/{chatId}` document exists and appears in inbox.

### Venue calendar parity helpers
- Adds `subscribeVenueCalendar`, `fetchVenueCalendar`, `saveVenueCalendar`, and `getDateStatus`.

### Vendor services parity helpers
- Adds `hydrateVenueFromFirestore`, `buildVenueSavePayload`, and `saveVendorService`.

### Settings DB persistence
- Notification preferences now save to `users/{uid}.notificationPreferences`.
- Payment settings now save to `venues/{venueId}.paymentSettings`.

## Runtime notes
- Automated calling still requires the backend server and a public HTTPS ngrok URL because Twilio cannot reach localhost directly.
- Chatbot and decor matching do not require ngrok when running on Android emulator with `MOBILE_BACKEND_URL=http://10.0.2.2:8001`.
