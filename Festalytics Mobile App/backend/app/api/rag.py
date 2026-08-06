from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag_service import ask_rag, get_areas, get_suggestions, runtime

router = APIRouter(prefix="/rag", tags=["RAG Chatbot"])


class ChatRequest(BaseModel):
    message: str
    stream: bool | None = False


@router.get("/health")
def health():
    return {
        "ready": runtime.ready,
        "halls": len(runtime.df) if runtime.df is not None else 0,
        "model": runtime.meta.get("model") or "llama-3.3-70b-versatile",
    }


@router.get("/meta")
def meta():
    return runtime.meta


@router.get("/areas")
def areas():
    return {"areas": get_areas()}


@router.get("/suggestions")
def suggestions():
    return {"suggestions": get_suggestions()}


@router.post("/chat")
def chat(req: ChatRequest):
    try:
        return ask_rag(req.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG error: {exc}")
