from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


def _csv_env(name: str, default: str = "") -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def _path_env(name: str, default: Path) -> str:
    raw = os.getenv(name, str(default))
    path = Path(raw)
    if path.is_absolute():
        return str(path)
    return str(BASE_DIR / path)


def _bool_env(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str = "Integrated Wedding AI Backend"
    environment: str = os.getenv("ENVIRONMENT", "development")
    port: int = int(os.getenv("PORT", "8001"))

    frontend_origins: list[str] = None

    # Separate Groq keys for each AI module. GROQ_API_KEY is kept as a fallback for backwards compatibility.
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    rag_groq_api_key: str = os.getenv("RAG_GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))
    clip_groq_api_key: str = os.getenv("CLIP_GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))
    twilio_groq_api_key: str = os.getenv("TWILIO_GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))

    groq_vision_model: str = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    groq_text_model: str = os.getenv("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")

    rag_data_path: str = _path_env(
        "RAG_DATA_PATH",
        BASE_DIR / "data" / "rag" / "data" / "marriage_halls_realistic_enhanced.xlsx",
    )
    rag_state_dir: str = _path_env(
        "RAG_STATE_DIR",
        BASE_DIR / "data" / "rag" / "rag_state",
    )

    clip_data_file: str = _path_env(
        "CLIP_DATA_FILE",
        BASE_DIR / "data" / "clip" / "hall_data.pkl",
    )
    clip_hall_dir: str = _path_env(
        "CLIP_HALL_DIR",
        BASE_DIR / "data" / "clip" / "Marriage hall",
    )
    use_clip: bool = _bool_env("USE_CLIP", "true")
    validate_clip_uploads: bool = _bool_env("VALIDATE_CLIP_UPLOADS", "true")

    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_api_key: str = os.getenv("TWILIO_API_KEY", "")
    twilio_api_secret: str = os.getenv("TWILIO_API_SECRET", "")
    twilio_twiml_app_sid: str = os.getenv("TWILIO_TWIML_APP_SID", "")
    twilio_phone_number: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8001")
    twilio_browser_identity: str = os.getenv("TWILIO_BROWSER_IDENTITY", "mobile-browser")

    # Google Sheets keys are usually consumed by the Next.js app, but are accepted here too
    # so the complete local environment can live in one backend/.env if desired.
    google_service_account_email: str = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "")
    google_private_key: str = os.getenv("GOOGLE_PRIVATE_KEY", "")
    google_sheet_id: str = os.getenv("GOOGLE_SHEET_ID", "")
    google_sheet_zaydan_calling_id: str = os.getenv("GOOGLE_SHEET_ZAYDAN_CALLING_ID", "")

    def __post_init__(self):
        if self.frontend_origins is None:
            object.__setattr__(
                self,
                "frontend_origins",
                _csv_env(
                    "FRONTEND_ORIGINS",
                    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
                ),
            )


settings = Settings()
