from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class CardBase(BaseModel):
    card_type: str = Field(default="basic", description="'basic' or 'cloze'")
    front: str = Field(..., description="Front side or cloze sentence (e.g. '{{c1::Mitochondria}} is the powerhouse of the cell')")
    back: str = Field(..., description="Back side or explanation")
    tags: List[str] = Field(default_factory=list)
    source_context: Optional[str] = None

class CardCreate(CardBase):
    order_index: int = 0

class CardUpdate(BaseModel):
    card_type: Optional[str] = None
    front: Optional[str] = None
    back: Optional[str] = None
    tags: Optional[List[str]] = None
    source_context: Optional[str] = None
    order_index: Optional[int] = None

class CardResponse(CardBase):
    id: str
    deck_id: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class GeneratedCard(BaseModel):
    card_type: str = Field(default="basic", description="Either 'basic' or 'cloze'")
    front: str = Field(..., description="Card question or cloze sentence containing {{c1::...}}")
    back: str = Field(..., description="Answer or explanation")
    tags: List[str] = Field(default_factory=list, description="Relevant topic tags")
    source_context: Optional[str] = Field(None, description="Optional brief snippet from context")

class CardGenerateRequest(BaseModel):
    content: str = Field(..., min_length=10, description="Raw text or extracted web content")
    source_type: str = Field(default="text", description="'text' or 'url'")
    source_url: Optional[str] = None
    format: str = Field(default="mixed", description="'basic', 'cloze', or 'mixed'")
    quantity: int = Field(default=10, ge=1, le=50)
    custom_prompt: Optional[str] = None

class CardGenerateResponse(BaseModel):
    deck_title: str
    cards: List[GeneratedCard]

class CardRefineRequest(BaseModel):
    cards: List[GeneratedCard]
    instructions: str = Field(..., min_length=3, description="Instructions to refine the cards")
    deck_title: Optional[str] = None

class CardRefineResponse(BaseModel):
    deck_title: str
    cards: List[GeneratedCard]
