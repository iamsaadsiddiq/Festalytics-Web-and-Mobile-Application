# Integrated Wedding AI Backend

Single FastAPI backend for:

- Groq RAG wedding hall chatbot
- CLIP/PIL decor matcher with Groq Vision validation
- Twilio browser-based voice confirmation calls

## Run

```powershell
cd backend
python -m uvicorn app.main:app --reload --env-file .env --host 0.0.0.0 --port 8001
```

## Health checks

```text
http://localhost:8001/health
http://localhost:8001/api/rag/health
http://localhost:8001/api/clip/stats
http://localhost:8001/docs
```

## Twilio browser receiver

With ngrok forwarding port 8001, open:

```text
https://your-ngrok-domain/mobile.html
```

Tap Register before starting a call from the booking page.

## Environment variables

The backend supports separate Groq keys:

```env
RAG_GROQ_API_KEY=
CLIP_GROQ_API_KEY=
TWILIO_GROQ_API_KEY=
```

`GROQ_API_KEY` remains as a fallback for compatibility.
