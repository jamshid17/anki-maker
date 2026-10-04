from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from app.schemas.card import CardCreate, CardResponse

class DeckCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    source_type: str = Field(default="text")
    source_content: Optional[str] = None
    cards: List[CardCreate] = Field(default_factory=list)

class DeckUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)

class DeckResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_content: Optional[str]
    created_at: datetime
    updated_at: datetime
    card_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class DeckDetailResponse(DeckResponse):
    cards: List[CardResponse] = []

    model_config = ConfigDict(from_attributes=True)

