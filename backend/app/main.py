from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base
from app.routers import (
    extract_router,
    cards_router,
    decks_router,
    anki_router,
    export_router,
    settings_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Anki Maker API",
    description="Intelligent flashcard generation and Anki sync backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(extract_router)
app.include_router(cards_router)
app.include_router(decks_router)
app.include_router(anki_router)
app.include_router(export_router)
app.include_router(settings_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "anki-maker-api",
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
