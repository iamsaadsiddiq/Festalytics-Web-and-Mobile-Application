from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import clip, rag, twilio_voice
from app.core.config import BASE_DIR, settings
from app.services.clip_service import load_clip_matcher
from app.services.rag_service import load_rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting integrated AI backend")
    load_rag()
    load_clip_matcher()
    print("Integrated AI backend is ready")
    yield
    print("Integrated AI backend stopped")


app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    description="Single FastAPI backend for Groq RAG chatbot, CLIP decor matching, and Twilio browser voice automation.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api")
app.include_router(clip.router, prefix="/api")
app.include_router(twilio_voice.router, prefix="/api")

static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

hall_assets_dir = Path(settings.clip_hall_dir)
if hall_assets_dir.exists():
    app.mount("/assets/halls", StaticFiles(directory=str(hall_assets_dir)), name="hall_images")


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "status": "ok",
        "routes": {
            "rag_chat": "/api/rag/chat",
            "rag_health": "/api/rag/health",
            "clip_match": "/api/clip/match",
            "twilio_call": "/api/twilio/initiate-call",
            "twilio_mobile_receiver": "/mobile.html",
            "docs": "/docs",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/mobile.html")
def mobile_receiver():
    mobile_path = static_dir / "twilio-mobile.html"
    if mobile_path.exists():
        return FileResponse(str(mobile_path), media_type="text/html")
    return {"error": "mobile receiver file not found"}
