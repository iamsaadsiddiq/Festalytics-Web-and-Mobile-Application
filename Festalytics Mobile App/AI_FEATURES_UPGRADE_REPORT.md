# AI Features Upgrade Report

This rebuild patches the mobile AI modules to follow the web implementation more closely.

## AI Planner / Chatbot

Changed in `lib/src/app_core.dart`:

- Calls the same FastAPI route as the web RAG proxy: `/api/rag/chat`.
- Reads the backend's real response field: `reply`.
- Renders structured Markdown-style output: headings, bullets, notes, and budget calculations.
- Shows matched hall photo cards from the backend `halls` response.
- Shows match metadata: exact matches and halls shown.
- Includes quick prompts equivalent to the web starter prompt experience.
- Keeps the feature behind the user login guard.

## AI Decor Matcher

Changed in `lib/src/app_core.dart`:

- Calls the same FastAPI route as the web decor matcher: `/api/clip/match`.
- Sends the multipart image field as `image`, matching backend `UploadFile = File(...)`.
- Handles rejected/irrelevant images the same way as the web: `rejected`, `subject`, and `detail`.
- Shows a clear rejection panel if the backend detects a person, car, food, document, exterior, or other irrelevant content.
- Shows dynamic match result UI for valid decor images: method, total halls, top match, ranked halls, similarity score, and decoded Base64 gallery images.
- Keeps the feature behind the user login guard.

## AI Automated Calling

Changed in `lib/src/app_core.dart`:

- Vendor booking cards now include a live AI confirmation call panel.
- The panel can open the Twilio receiver registration page: `/mobile.html`.
- It posts booking data to `/api/twilio/booking-info` before starting the call.
- It starts the call through `/api/twilio/initiate-call`.
- It polls `/api/twilio/booking-info?bookingId=...` every 2 seconds after starting.
- It displays live call status, mobile registration status, Call SID, last speech, and proof recording link.
- It can apply accepted/cancelled call decisions back to the quotation document in Firestore.

## Required for automated calling

The Twilio call flow still requires a public HTTPS backend URL, because Twilio cannot call localhost, 10.0.2.2, or 0.0.0.0.

Run ngrok against the backend port:

```powershell
ngrok http 8001
```

Then set this in `.env`:

```env
PUBLIC_BASE_URL=https://your-current-ngrok-url.ngrok-free.app
```

Restart the backend, open:

```text
https://your-current-ngrok-url.ngrok-free.app/mobile.html
```

Tap Register, then start the AI call from the mobile vendor booking panel.

## Honest limitation

Flutter/Dart SDK is not installed in this ChatGPT sandbox, so I could not run `flutter analyze` or `flutter run` here. The code has been patched directly based on the project structure and backend route contracts. If your local compiler shows another specific error, share the log and it can be patched against the exact file/line.
