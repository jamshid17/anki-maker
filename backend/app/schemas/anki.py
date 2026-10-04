from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.card import CardCreate

class AnkiTestResponse(BaseModel):
    connected: bool
    version: Optional[int] = None
    error: Optional[str] = None

class AnkiDeckListResponse(BaseModel):
    decks: List[str]

class AnkiSyncRequest(BaseModel):
    target_deck_name: str = Field(..., min_length=1)
    deck_id: Optional[str] = None
    cards: Optional[List[CardCreate]] = None

class AnkiSyncResponse(BaseModel):
    success: bool
    notes_added: int
    deck_name: str
    error: Optional[str] = None
