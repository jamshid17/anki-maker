import urllib.parse
from fastapi import APIRouter, HTTPException, Depends, status, Response
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.deck import Deck
from app.schemas.card import CardBase
from app.services.exporter import export_deck_to_apkg, export_deck_to_csv

router = APIRouter(prefix="/api/export", tags=["Export"])

class RawExportRequest(BaseModel):
    deck_title: str = Field(default="Flashcards")
    cards: List[CardBase]

@router.get("/deck/{deck_id}/apkg")
def export_saved_deck_apkg(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    cards_data = [
        {
            "card_type": c.card_type,
            "front": c.front,
            "back": c.back,
            "tags": c.tags
        }
        for c in deck.cards
    ]

    apkg_bytes = export_deck_to_apkg(deck.id, deck.title, cards_data)
    encoded_title = urllib.parse.quote(f"{deck.title}.apkg")

    return Response(
        content=apkg_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_title}"
        }
    )

@router.get("/deck/{deck_id}/csv")
def export_saved_deck_csv(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    cards_data = [
        {
            "card_type": c.card_type,
            "front": c.front,
            "back": c.back,
            "tags": c.tags
        }
        for c in deck.cards
    ]

    csv_data = export_deck_to_csv(cards_data)
    encoded_title = urllib.parse.quote(f"{deck.title}.csv")

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_title}"
        }
    )

@router.post("/raw/apkg")
def export_raw_cards_apkg(payload: RawExportRequest):
    if not payload.cards:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No cards provided")

    cards_data = [c.model_dump() for c in payload.cards]
    apkg_bytes = export_deck_to_apkg("temp-deck-export", payload.deck_title, cards_data)
    encoded_title = urllib.parse.quote(f"{payload.deck_title}.apkg")

    return Response(
        content=apkg_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_title}"
        }
    )

@router.post("/raw/csv")
def export_raw_cards_csv(payload: RawExportRequest):
    if not payload.cards:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No cards provided")

    cards_data = [c.model_dump() for c in payload.cards]
    csv_data = export_deck_to_csv(cards_data)
    encoded_title = urllib.parse.quote(f"{payload.deck_title}.csv")

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_title}"
        }
    )
