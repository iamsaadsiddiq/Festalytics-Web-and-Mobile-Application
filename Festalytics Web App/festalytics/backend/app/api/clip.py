from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.clip_service import get_stats, match_decor_image

router = APIRouter(prefix="/clip", tags=["CLIP Decor Matcher"])


@router.get("/stats")
def stats():
    return get_stats()


@router.post("/match")
async def match(image: UploadFile = File(...)):
    try:
        raw = await image.read()
        return match_decor_image(raw, top_k=5)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Decor matcher error: {exc}")
