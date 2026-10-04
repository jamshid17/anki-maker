from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.deck import Deck
from app.models.card import Card
from app.schemas.deck import DeckCreate, DeckUpdate, DeckResponse, DeckDetailResponse
from app.schemas.card import CardCreate, CardResponse

router = APIRouter(prefix="/api/decks", tags=["Decks"])

@router.get("", response_model=List[DeckResponse])
def get_all_decks(db: Session = Depends(get_db)):
    # Query decks with card counts
    decks = db.query(Deck).order_by(Deck.created_at.desc()).all()
    results = []
    for d in decks:
        count = db.query(func.count(Card.id)).filter(Card.deck_id == d.id).scalar() or 0
        results.append(
            DeckResponse(
                id=d.id,
                title=d.title,
                source_type=d.source_type,
                source_content=d.source_content,
                created_at=d.created_at,
                updated_at=d.updated_at,
                card_count=count
            )
        )
    return results

@router.post("", response_model=DeckDetailResponse, status_code=status.HTTP_201_CREATED)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db)):
    deck = Deck(
        title=payload.title,
        source_type=payload.source_type,
        source_content=payload.source_content
    )
    db.add(deck)
    db.flush()

    cards = []
    for idx, card_in in enumerate(payload.cards):
        card = Card(
            deck_id=deck.id,
            card_type=card_in.card_type,
            front=card_in.front,
            back=card_in.back,
            tags=card_in.tags or [],
            source_context=card_in.source_context,
            order_index=card_in.order_index if card_in.order_index is not None else idx
        )
        db.add(card)
        cards.append(card)

    db.commit()
    db.refresh(deck)

    return DeckDetailResponse(
        id=deck.id,
        title=deck.title,
        source_type=deck.source_type,
        source_content=deck.source_content,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        card_count=len(cards),
        cards=[CardResponse.model_validate(c) for c in cards]
    )

@router.get("/{deck_id}", response_model=DeckDetailResponse)
def get_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    return DeckDetailResponse(
        id=deck.id,
        title=deck.title,
        source_type=deck.source_type,
        source_content=deck.source_content,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        card_count=len(deck.cards),
        cards=[CardResponse.model_validate(c) for c in deck.cards]
    )

@router.put("/{deck_id}", response_model=DeckResponse)
def update_deck(deck_id: str, payload: DeckUpdate, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    if payload.title is not None:
        deck.title = payload.title

    db.commit()
    db.refresh(deck)

    count = db.query(func.count(Card.id)).filter(Card.deck_id == deck.id).scalar() or 0
    return DeckResponse(
        id=deck.id,
        title=deck.title,
        source_type=deck.source_type,
        source_content=deck.source_content,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        card_count=count
    )

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    db.delete(deck)
    db.commit()
    return None

@router.post("/{deck_id}/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def add_card_to_deck(deck_id: str, payload: CardCreate, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    card = Card(
        deck_id=deck.id,
        card_type=payload.card_type,
        front=payload.front,
        back=payload.back,
        tags=payload.tags or [],
        source_context=payload.source_context,
        order_index=payload.order_index
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return CardResponse.model_validate(card)
