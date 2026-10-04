from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/status")
def get_settings_status():
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    # Mask key if present
    masked_key = ""
    if has_key:
        k = settings.GEMINI_API_KEY.strip()
        masked_key = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"

    return {
        "gemini_configured": has_key,
        "gemini_masked_key": masked_key,
        "gemini_model": settings.GEMINI_MODEL,
        "anki_url": settings.ANKI_CONNECT_URL
    }
