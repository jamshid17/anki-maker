from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.deck import Deck
from app.schemas.anki import AnkiTestResponse, AnkiDeckListResponse, AnkiSyncRequest, AnkiSyncResponse
from app.services.anki_connect import anki_client, AnkiConnectError

router = APIRouter(prefix="/api/anki", tags=["AnkiConnect"])

@router.post("/test", response_model=AnkiTestResponse)
async def test_anki_connection():
    result = await anki_client.test_connection()
    return AnkiTestResponse(**result)

@router.get("/decks", response_model=AnkiDeckListResponse)
async def list_anki_decks():
    try:
        decks = await anki_client.get_deck_names()
        return AnkiDeckListResponse(decks=decks)
    except AnkiConnectError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/sync", response_model=AnkiSyncResponse)
async def sync_to_anki(payload: AnkiSyncRequest, db: Session = Depends(get_db)):
    cards_to_push = []

    # If cards provided in body, use them
    if payload.cards:
        cards_to_push = [c.model_dump() for c in payload.cards]
    elif payload.deck_id:
        deck = db.query(Deck).filter(Deck.id == payload.deck_id).first()
        if not deck:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
        cards_to_push = [
            {
                "card_type": c.card_type,
                "front": c.front,
                "back": c.back,
                "tags": c.tags
            }
            for c in deck.cards
        ]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either deck_id or a list of cards to sync"
        )

    if not cards_to_push:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No cards found to sync"
        )

    try:
        added_count = await anki_client.add_cards_to_deck(
            deck_name=payload.target_deck_name,
            cards=cards_to_push
        )
        return AnkiSyncResponse(
            success=True,
            notes_added=added_count,
            deck_name=payload.target_deck_name
        )
    except AnkiConnectError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anki sync failed: {str(e)}"
        )
