from app.routers.extract import router as extract_router
from app.routers.cards import router as cards_router
from app.routers.decks import router as decks_router
from app.routers.anki import router as anki_router
from app.routers.export import router as export_router
from app.routers.settings import router as settings_router

__all__ = [
    "extract_router",
    "cards_router",
    "decks_router",
    "anki_router",
    "export_router",
    "settings_router"
]
