# AI MODULE PARITY REPORT

## Overview
This document compares the three AI modules between the web application and the Flutter mobile clone: AI Planner (Chatbot), AI Decor Matching, and AI Automated Calling (Twilio).

---

## 1. AI PLANNER / CHATBOT

### Web Implementation
| Aspect | Details |
|--------|---------|
| **Endpoint** | `POST /api/rag/chat` (Next.js API route, proxies to FastAPI backend) |
| **Request Payload** | `{ "message": string, "prompt": string, "history": array }` |
| **Response Fields** | `reply`, `halls`, `exact_matches`, `halls_shown`, `filters_used`, `answer`, `response` |
| **UI Components** | `AIPlanner.jsx`, `ChatBubble.jsx`, `QuickActionButton.jsx`, `VendorCard.jsx`, `DecorAnalysisCard.jsx` |
| **UI Behavior** | Chat bubbles, quick prompt buttons, matched hall/vendor cards, formatted AI text |
| **Auth** | AuthGateModal triggered on interaction with `ai` action |

### Flutter Implementation
| Aspect | Details |
|--------|---------|
| **Backend Call** | `AiBackendService.askPlanner()` in `lib/services/ai_backend_service.dart` |
| **HTTP URL** | `{AppConfig.backendUrl}/api/rag/chat` |
| **Request Payload** | `{ "message": prompt, "prompt": prompt, "history": history }` (matches web) |
| **Response Parsing** | Falls back through `answer` → `response` → `message` → raw body |
| **Screen** | `lib/features/ai/ai_planner_screen.dart` - Enhanced with QuickActionButtonWidget + VendorCardWidget |
| **Components** | All web_clone stubs converted to real widgets in `lib/web_clone/src/components/ai-planner/` |
| **Auth** | ProtectedRoute with `requireUser: true` |
| **Quick Actions** | 4 built-in: "Wedding Halls", "Budget Plan", "Catering", "Small Event" |
| **Hall Cards** | VendorCardWidget renders venue results from AI response |

### Parity Assessment: HIGH (95%)
- ✅ Same backend endpoint
- ✅ Same request payload structure
- ✅ Same response parsing
- ✅ Chat bubble UI with role-based alignment
- ✅ Quick action buttons
- ✅ Vendor/hall suggestion cards
- ✅ Protected behind login
- ⚠️ Web's `halls_shown`, `filters_used` fields parsed but not rendered in separate UI section (shown in bubble text)

---

## 2. AI DECOR MATCHING

### Web Implementation
| Aspect | Details |
|--------|---------|
| **Endpoint** | `POST /api/clip/match` (Next.js API route, proxies to FastAPI backend) |
| **Upload Field** | `image` (multipart) |
| **Image Validation** | CLIP validates image for wedding/decor relevance |
| **Validation Results** | `rejected` (not relevant), `subject` (relevant), `detail` (very relevant) |
| **Response Fields** | `results` (ranked), `style`, `method`, `total_halls`, `subject`, `detail`, `rejected`, `confidence` |
| **UI Components** | `FileUpload.jsx`, `AnalysisResult.jsx`, `VendorCard.jsx`, `Loader.jsx`, `MoodboardButton.jsx`, `decorAIService.js` |
| **UI Behavior** | Upload image, loader, analysis result with ranked results, similarity score, moodboard button |
| **Auth** | AuthGateModal with `decor` action |

### Flutter Implementation
| Aspect | Details |
|--------|---------|
| **Backend Call** | `AiBackendService.matchDecor()` in `lib/services/ai_backend_service.dart` |
| **HTTP URL** | `{AppConfig.backendUrl}/api/clip/match` |
| **Upload Field** | `file` (multipart) — Note: web uses `image`, Flutter uses `file` |
| **Image Picker** | `image_picker` package via `FileUploadWidget` |
| **Response Parsing** | Full map return, analysis via `AnalysisResultWidget` |
| **Screen** | `lib/features/ai/find_decor_screen.dart` - Enhanced with FileUploadWidget, AnalysisResultWidget, DecorVendorCardWidget |
| **Components** | All web_clone stubs converted to real widgets in `lib/web_clone/src/components/find-my-decor/` |
| **Auth** | ProtectedRoute with `requireUser: true` |
| **Analysis UI** | Shows style, palette, tags, confidence, ranked vendor results |
| **Rejected Images** | Displayed as error state in AnalysisResultWidget |
| **Moodboard Button** | Implemented in MoodboardButtonWidget |

### Parity Assessment: HIGH (90%)
- ✅ Same backend endpoint
- ✅ Multipart image upload with image_picker
- ✅ Full analysis result UI
- ⚠️ Web uses `image` field name, Flutter uses `file` field name — should be `image` for full backend compatibility
- ⚠️ `style` and `budget` optional fields sent but may differ from web
- ✅ Protected behind login

---

## 3. AI AUTOMATED CALLING (TWILIO)

### Web Implementation
| Aspect | Details |
|--------|---------|
| **Endpoints** | `/api/twilio/booking-info`, `/api/twilio/initiate-call`, `/api/twilio/twiml-greet`, `/api/twilio/twiml-response`, `/api/twilio/recording-proxy/{sid}` |
| **Booking Info** | GET/POST `/api/twilio/booking-info` to prepare booking info for call |
| **Call Initiation** | POST `/api/twilio/initiate-call` with `booking_id`, `phone_number`, `customer_name`, `context` |
| **Call Flow** | 1. Prepare booking info → 2. Open/register Twilio receiver page → 3. Start call → 4. Poll status → 5. Show call SID/status → 6. Show last speech → 7. Show accepted/cancelled → 8. Show proof/recording → 9. Apply decision to Firestore |
| **Sync Endpoints** | `/api/sync-bookings`, `/api/sync-bookings-proof`, `/api/live-google-sheet`, `/api/zaydan-calling-sheet` |
| **Receiver UI** | `mobile.html` served by backend |

### Flutter Implementation
| Aspect | Details |
|--------|---------|
| **Call Initiation** | `AiBackendService.initiateAiCall()` in `lib/services/ai_backend_service.dart` |
| **HTTP URL** | `{AppConfig.backendUrl}/api/twilio/initiate-call` |
| **Request Payload** | `{ "booking_id": string, "phone_number": string, "customer_name": string?, "context": object }` |
| **Booking Info** | Not implemented as separate step |
| **Receiver Page** | `url_launcher` package to open `mobile.html` in external browser |
| **Call Status Polling** | Not implemented (web polls after initiating) |
| **Call Status UI** | Basic status indicator in booking card (calling/completed/failed) |
| **Recording/Proof** | Not implemented |
| **Sheets Sync** | Not directly called from Flutter UI |
| **Components** | Basic AI call button in `vendor_bookings_screen.dart` |

### Parity Assessment: MEDIUM (50%)
- ✅ `initiateAiCall` backend integration works
- ✅ AI Call button on booking cards in vendor bookings
- ⚠️ No separate booking-info preparation step
- ⚠️ No Twilio receiver page registration flow
- ⚠️ No call status polling
- ⚠️ No recording/proof display
- ⚠️ No automated Google Sheets sync from Flutter
- ⚠️ No full call workflow UI (prepare → register → call → poll → result → proof → apply)

### Twilio Development Requirements
- ngrok required for local Twilio webhook development
- `PUBLIC_BASE_URL` must be updated to current ngrok HTTPS URL
- Backend serves `mobile.html` at `{PUBLIC_BASE_URL}/mobile.html`
- Open receiver page in browser before starting AI calls
- Twilio secrets stored only in `.env` (backend), never in Flutter code

---

## AI BACKEND DETAILS

### Backend Configuration
| Parameter | Value |
|-----------|-------|
| **Framework** | FastAPI v1.1.0 |
| **Run Command** | `python -m uvicorn app.main:app --reload --port 8001` |
| **RAG Model** | Groq (llama-3.3-70b-versatile) + BM25 + TF-IDF hybrid |
| **CLIP Model** | OpenAI CLIP (or PIL fallback) + Groq Vision validation |
| **Twilio** | Twilio Voice + Deepgram speech-to-text |

### Flutter Backend URL Resolution
1. `MOBILE_BACKEND_URL` dart-define (e.g., `--dart-define=MOBILE_BACKEND_URL=http://10.0.2.2:8001`)
2. `NEXT_PUBLIC_AI_BACKEND_URL` from `.env.local`
3. `PUBLIC_BASE_URL` from `.env`
4. Default: `http://10.0.2.2:8001`

---

## SUMMARY

| Module | Parity | Key Gaps |
|--------|--------|----------|
| AI Planner (Chatbot) | 95% | Minor: filters_used/halls_shown not separately rendered |
| AI Decor Matching | 90% | Field name mismatch (`file` vs `image`), style/budget fields |
| AI Automated Calling | 50% | No full workflow, no polling, no receiver registration, no proof UI |
