from __future__ import annotations

import base64
import io
import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import requests
from PIL import Image, ImageFilter

from app.core.config import settings

CLIP_AVAILABLE = False
clip_model = None
clip_preprocess = None
HALL_DATA: dict[str, Any] = {}

VALIDATION_PROMPT = """You are a strict visual relevance checker for a wedding hall interior matching system.
Analyse the uploaded image and respond only with a JSON object. Do not return markdown or extra text.

Acceptance rule:
- valid=true only if the image clearly shows an indoor wedding hall, banquet hall, marriage hall, marquee interior, decorated event hall, stage setup, seating/table setup, lighting, floral decor, or another indoor venue setup suitable for decor matching.

Rejection rule:
- valid=false for people, selfies, celebrities, athletes, food, animals, cars, documents, logos, sports scenes, exterior buildings, outdoor landscapes, random objects, screenshots, or any image that is not an indoor wedding/event hall interior.
- For invalid images, set subject to a concise category of what is visible, such as "a footballer/person", "a car", "food", "an outdoor building", or "a document". Do not identify real people by name.
- The detail must explain why it is not usable and must ask the user to upload an indoor wedding hall interior image.

JSON schema: {"valid": true|false, "subject": "short noun phrase", "detail": "polite rejection sentence"}
"""


def _parse_validation_json(raw: str) -> dict[str, Any]:
    cleaned = (raw or "").strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def _image_to_b64(img: Image.Image, size: tuple[int, int] = (768, 768), quality: int = 82) -> str:
    thumb = img.copy()
    thumb.thumbnail(size, Image.LANCZOS)
    buf = io.BytesIO()
    thumb.save(buf, "JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def validate_image(img_b64: str) -> dict[str, Any]:
    if not settings.validate_clip_uploads or not settings.clip_groq_api_key:
        return {"ok": True}
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            timeout=15,
            headers={
                "Authorization": f"Bearer {settings.clip_groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.groq_vision_model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                            {"type": "text", "text": VALIDATION_PROMPT},
                        ],
                    }
                ],
                "max_tokens": 200,
                "temperature": 0,
            },
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"]
        data = _parse_validation_json(raw)
        if data.get("valid"):
            return {"ok": True, "subject": data.get("subject", "wedding hall interior")}
        subject = str(data.get("subject") or "irrelevant image content").strip()
        detail = str(data.get("detail") or "This image is not suitable for decor matching. Please upload an indoor wedding hall interior image.").strip()
        return {
            "ok": False,
            "subject": subject,
            "detail": detail,
        }
    except Exception as exc:
        print(f"Groq validation skipped: {exc}")
        return {"ok": True}


def try_load_clip() -> None:
    global CLIP_AVAILABLE, clip_model, clip_preprocess
    if not settings.use_clip:
        CLIP_AVAILABLE = False
        return
    try:
        import torch
        import clip as openai_clip

        device = "cuda" if torch.cuda.is_available() else "cpu"
        clip_model, clip_preprocess = openai_clip.load("ViT-B/32", device=device)
        clip_model.eval()
        CLIP_AVAILABLE = True
        print(f"CLIP ready on {device}")
    except Exception as exc:
        print(f"CLIP unavailable; using PIL feature matching instead: {exc}")
        CLIP_AVAILABLE = False


def extract_clip_feature(img: Image.Image) -> np.ndarray:
    import torch

    device = next(clip_model.parameters()).device
    tensor = clip_preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        feature = clip_model.encode_image(tensor)
        feature = feature / feature.norm(dim=-1, keepdim=True)
    return feature.squeeze().cpu().numpy()


def extract_pil_feature(img: Image.Image) -> np.ndarray:
    img_s = img.resize((224, 224))
    arr = np.array(img_s, dtype=np.float32) / 255.0

    hsv = img_s.convert("HSV")
    h_arr = np.array(hsv)
    color = np.concatenate(
        [
            np.histogram(h_arr[:, :, 0], bins=64, range=(0, 255))[0],
            np.histogram(h_arr[:, :, 1], bins=32, range=(0, 255))[0],
            np.histogram(h_arr[:, :, 2], bins=32, range=(0, 255))[0],
        ]
    ).astype(np.float32)
    color /= color.sum() + 1e-8

    grid, cell_w, cell_h = [], 224 // 8, 224 // 8
    for row in range(8):
        for col in range(8):
            grid.extend(arr[row * cell_h : (row + 1) * cell_h, col * cell_w : (col + 1) * cell_w].mean(axis=(0, 1)).tolist())
    grid = np.array(grid, dtype=np.float32)

    gray = img_s.convert("L")
    g_arr = np.array(gray, dtype=np.float32) / 255.0
    fine_w, fine_h = 224 // 16, 224 // 16
    fine = np.array(
        [g_arr[row * fine_h : (row + 1) * fine_h, col * fine_w : (col + 1) * fine_w].mean() for row in range(16) for col in range(16)],
        dtype=np.float32,
    )

    edges = np.array(gray.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    edge_hist = np.histogram(edges, bins=32, range=(0, 255))[0].astype(np.float32)
    edge_hist /= edge_hist.sum() + 1e-8

    stats = np.array([arr[:, :, c].mean() for c in range(3)] + [arr[:, :, c].std() for c in range(3)], dtype=np.float32)
    feature = np.concatenate([color * 2.5, grid * 1.8, fine, edge_hist * 0.5, stats * 0.8])
    return feature / (np.linalg.norm(feature) + 1e-8)


def extract_feature(img: Image.Image) -> np.ndarray:
    return extract_clip_feature(img) if CLIP_AVAILABLE else extract_pil_feature(img)


def current_feature_dim() -> int:
    if CLIP_AVAILABLE:
        return 512
    return len(extract_pil_feature(Image.new("RGB", (224, 224))))


def _stored_feature_dim() -> int:
    try:
        first_hall = next(iter(HALL_DATA.values()))
        return len(first_hall["all_features"][0])
    except Exception:
        return 0


def build_database(hall_dir: str) -> None:
    global HALL_DATA
    hall_path = Path(hall_dir)
    halls: dict[str, Any] = {}
    for hall_name in sorted(p.name for p in hall_path.iterdir() if p.is_dir()):
        image_paths = sorted(
            p
            for p in (hall_path / hall_name).iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"} and not p.name.startswith(".")
        )
        features, images_b64 = [], []
        for image_path in image_paths:
            try:
                img = Image.open(image_path).convert("RGB")
                images_b64.append(_image_to_b64(img, size=(600, 450), quality=85))
                features.append(extract_feature(img))
            except Exception as exc:
                print(f"Could not process {image_path}: {exc}")
        if features:
            avg = np.mean(features, axis=0)
            avg /= np.linalg.norm(avg) + 1e-8
            halls[hall_name] = {
                "avg_feature": avg.tolist(),
                "all_features": [feature.tolist() for feature in features],
                "images_b64": images_b64,
                "feature_dim": len(features[0]),
            }
    HALL_DATA = halls
    Path(settings.clip_data_file).write_bytes(pickle.dumps(halls))


def load_clip_matcher() -> None:
    global HALL_DATA
    try_load_clip()
    data_file = Path(settings.clip_data_file)
    if data_file.exists():
        HALL_DATA = pickle.loads(data_file.read_bytes())
        if _stored_feature_dim() == current_feature_dim():
            print(f"Decor matcher ready with {len(HALL_DATA)} halls")
            return
        print("Decor matcher feature dimension changed; rebuilding database")
    build_database(settings.clip_hall_dir)
    print(f"Decor matcher rebuilt with {len(HALL_DATA)} halls")


def cosine_sim(a: Any, b: Any) -> float:
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def match_decor_image(raw_bytes: bytes, top_k: int = 5) -> dict[str, Any]:
    if not HALL_DATA:
        raise RuntimeError("Decor matcher database is empty. Check CLIP_HALL_DIR and hall_data.pkl.")
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Invalid image file. Please upload a JPG, PNG, or WEBP image.")

    uploaded_image = _image_to_b64(img)
    validation = validate_image(uploaded_image)
    if not validation.get("ok"):
        subject = validation.get("subject", "irrelevant image content")
        detail = validation.get("detail") or f"This image appears to show {subject}, so it cannot be used for decor matching. Please upload an indoor wedding hall interior image."
        return {
            "rejected": True,
            "subject": subject,
            "detail": detail,
            "validation_label": f"Rejected: {subject}",
            "uploaded_image": uploaded_image,
            "results": [],
            "method": "CLIP" if CLIP_AVAILABLE else "PIL Features",
        }

    query_feature = extract_feature(img)
    query_dim = len(query_feature)
    scores = []
    for name, data in HALL_DATA.items():
        stored_dim = len(data["all_features"][0])
        if stored_dim != query_dim:
            continue
        individual_scores = sorted([cosine_sim(query_feature, feature) for feature in data["all_features"]], reverse=True)
        top3 = float(np.mean(individual_scores[: min(3, len(individual_scores))]))
        avg = cosine_sim(query_feature, data["avg_feature"])
        score = 0.65 * top3 + 0.35 * avg
        scores.append((name, score, data["images_b64"]))

    if not scores:
        raise RuntimeError("No halls could be matched. Delete hall_data.pkl and restart the backend to rebuild it.")

    scores.sort(key=lambda item: item[1], reverse=True)
    results = [
        {
            "rank": index,
            "hall_name": name,
            "similarity": round(score * 100, 1),
            "images": images[:4],
        }
        for index, (name, score, images) in enumerate(scores[:top_k], 1)
    ]
    return {
        "uploaded_image": uploaded_image,
        "results": results,
        "method": "CLIP" if CLIP_AVAILABLE else "PIL Features",
        "total_halls": len(HALL_DATA),
    }


def get_stats() -> dict[str, Any]:
    return {"total_halls": len(HALL_DATA), "method": "CLIP" if CLIP_AVAILABLE else "PIL Features"}
