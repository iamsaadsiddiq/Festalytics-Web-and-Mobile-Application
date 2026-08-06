# RUN FLOW INSTRUCTIONS

## Overview
This document describes how to run the Festalytics mobile clone (Flutter) with the backend (FastAPI) and Twilio integration.

---

## PREREQUISITES

### Required Software
| Software | Version | Purpose |
|----------|---------|---------|
| Flutter SDK | ^3.9.0 | Mobile app framework |
| Dart SDK | ^3.9.0 | Language SDK |
| Python | 3.10+ | Backend runtime |
| ngrok | Latest | Twilio webhook tunneling |
| Node.js | 18+ | (Optional) For web app reference |

### Required Accounts
| Service | Purpose |
|---------|---------|
| Firebase | Auth, Firestore, Storage (project: `festalytics-1940a`) |
| Groq | RAG chatbot LLM API |
| Twilio | Voice calling API |
| Deepgram | Speech-to-text for calls |
| Google Cloud | Sheets API for booking sync |

---

## 1. BACKEND SETUP & RUN

### Navigate to Backend
The backend is inside the Flutter project root:
```bash
cd D:\festalytics-app-full-clone\backend
```

### Create Virtual Environment (first time only)
```bash
python -m venv venv
venv\Scripts\activate    # Windows
# OR
source venv/bin/activate # Linux/Mac
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Configure Environment
Ensure `.env` file exists in the backend directory with all required keys:
```env
PORT=8001
ENVIRONMENT=development
FRONTEND_ORIGINS=http://localhost:3000,http://10.0.2.2:8001

# Groq API Keys
RAG_GROQ_API_KEY=your_key_here
CLIP_GROQ_API_KEY=your_key_here
TWILIO_GROQ_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=llama-4-scout-17b-16e-instruct

# CLIP Settings
VALIDATE_CLIP_UPLOADS=true
USE_CLIP=true

# Data Paths
RAG_DATA_PATH=data/rag/data/marriage_halls_realistic_enhanced.xlsx
RAG_STATE_DIR=data/rag/rag_state
CLIP_DATA_FILE=data/clip/hall_data.pkl
CLIP_HALL_DIR=data/clip/Marriage hall

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=+1234567890

# ngrok
PUBLIC_BASE_URL=http://localhost:8001  # Update to ngrok URL when using Twilio
NGROK_AUTH_TOKEN=your_ngrok_token

# Speech-to-Text
DEEPGRAM_API_KEY=your_deepgram_key

# Google Sheets (optional, for booking sync)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SHEET_ZAYDAN_CALLING_ID=your_zaydan_sheet_id
```

### Run Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8001
```

Backend will be available at `http://localhost:8001`.

### Health Check
```bash
curl http://localhost:8001/health
```

---

## 2. FLUTTER MOBILE APP SETUP & RUN

### Prerequisites
- Flutter SDK installed and on PATH
- Android SDK (for Android emulator) or iOS Simulator
- Firebase project `festalytics-1940a` configured

### Install Flutter Dependencies
```bash
cd D:\festalytics-app-full-clone
flutter pub get
```

### Clean Build (if needed)
```bash
flutter clean
flutter pub get
```

### Run on Android Emulator
```bash
flutter run --dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001
```

### Run on iOS Simulator
```bash
flutter run --dart-define=MOBILE_BACKEND_URL=http://localhost:8001
```

### Run on Physical Device
Replace `10.0.2.2` with your computer's local network IP address:
```bash
flutter run --dart-define=MOBILE_BACKEND_URL=http://192.168.x.x:8001
```

### Build APK
```bash
flutter build apk --debug --dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001
```

---

## 3. TWILIO AI CALLING SETUP

### Step 1: Start ngrok
```bash
ngrok http 8001
```

### Step 2: Update Backend .env
After ngrok starts, set:
```env
PUBLIC_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### Step 3: Restart Backend
```bash
# Stop the running backend and start again
python -m uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8001
```

### Step 4: Open Twilio Receiver Page
Open in a browser:
```
https://your-ngrok-url.ngrok-free.app/mobile.html
```

This registers the browser as a Twilio device for receiving calls.

### Step 5: Use AI Call from Mobile App
1. Log in as vendor
2. Navigate to Bookings
3. Tap "AI Call" button on a booking card
4. The call will be initiated through Twilio

---

## 4. ENVIRONMENT VARIABLES REFERENCE

### Flutter .env.local (frontend)
```env
# Path: D:\festalytics-app-full-clone\.env.local
NEXT_PUBLIC_AI_BACKEND_URL=http://10.0.2.2:8001

# Google Sheets (if needed from Flutter)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_ZAYDAN_CALLING_ID=...
```

### Flutter .env (backend mirror for reference)
```env
# Path: D:\festalytics-app-full-clone\.env
# Contains the same keys as backend .env for development reference
# Not used at runtime by Flutter — Flutter uses dart-define and .env.local
```

---

## 5. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Firebase not initialized | Ensure `firebase_options.dart` has correct `apiKey` for your platform |
| Backend connection refused | Check backend is running on port 8001, and MOBILE_BACKEND_URL is correct |
| Twilio calls not working | Ensure ngrok is running, PUBLIC_BASE_URL is updated, and mobile.html is open in browser |
| Image picker not working | Check Android/iOS permissions for camera/storage |
| Firestore permission denied | Check Firebase Auth is set up and Firestore rules allow access |
| Flutter analyze errors | Run `flutter analyze` and fix any reported issues |
| `flutter pub get` fails | Check internet connection and pubspec.yaml for dependency issues |

---

## 6. QUICK START (Summary)

```bash
# Terminal 1: Backend
cd D:\festalytics-app-full-clone\backend
python -m uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8001

# Terminal 2: Flutter (Android emulator)
cd D:\festalytics-app-full-clone
flutter run --dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001

# Terminal 3: ngrok (for Twilio)
ngrok http 8001
# Then update PUBLIC_BASE_URL in backend .env and restart backend
```
