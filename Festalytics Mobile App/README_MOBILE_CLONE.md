# Festalytics Flutter Mobile Clone

This folder is a full Flutter project built from the uploaded partial mobile app and the uploaded complete web app.

## What was cloned

- User login/signup with user/vendor role split.
- Vendor signup creates/links the same Firestore `users` and `venues` documents used by the web app.
- User dashboard, venue discovery, venue details, quotation request flow, event creation, event management, AI planner, decor matching and service discovery.
- Vendor dashboard, bookings/quotations approval, AI call trigger, services/profile editing, availability calendar, analytics, Borrow Hub, inventory, messages and settings.
- Same key Firestore collections used by web: `users`, `venues`, `bookings`, `quotations`, `events`, `chats`, `inventory_listings`, `borrow_requests`.
- Same backend integration pattern: Flutter calls the existing backend endpoints instead of embedding backend code inside mobile.

## Web-to-mobile file mapping

See `WEB_TO_FLUTTER_MAPPING.md`.

Every uploaded web JSX/JS file under `app/` and `src/` has a corresponding Dart mirror file under:

```text
lib/web_clone/
```

The runnable mobile implementation lives under:

```text
lib/features/
lib/services/
lib/models/
lib/providers/
lib/core/
```

## Run steps

From this folder:

```bat
flutter clean
flutter pub get
flutter run --dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001
```

For Android emulator, `10.0.2.2:8001` points to your laptop backend running on port 8001.

For a physical phone, replace it with your laptop LAN IP, for example:

```bat
flutter run --dart-define=MOBILE_BACKEND_URL=http://192.168.1.10:8001
```

## Backend must be running

Start the web/backend project separately:

```bat
cd backend
python -m uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8001
```

## Firebase

This project keeps the partial mobile app's Firebase Android/iOS config and `google-services.json`. It uses Firebase Auth, Firestore and Storage.

## Environment files

The uploaded `.env` and `.env.local` were copied into this project root as requested. Their contents are not repeated in this README.

## Important

A mobile app should not contain the backend server itself. The correct clone structure is:

```text
Flutter mobile app -> Firebase/Firestore
Flutter mobile app -> existing FastAPI backend endpoints
FastAPI backend     -> AI/Twilio/CLIP/RAG services
```
