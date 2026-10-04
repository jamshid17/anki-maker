from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.card import Card
from app.schemas.card import (
    CardGenerateRequest,
    CardGenerateResponse,
    CardRefineRequest,
    CardRefineResponse,
    CardUpdate,
    CardResponse
)
from app.services.llm.gemini import gemini_service, GeminiServiceError

router = APIRouter(prefix="/api/cards", tags=["Cards"])

@router.post("/generate", response_model=CardGenerateResponse)
async def generate_cards(payload: CardGenerateRequest):
    try:
        return await gemini_service.generate_cards(payload)
    except GeminiServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Card generation failed: {str(e)}"
        )

@router.post("/refine", response_model=CardRefineResponse)
async def refine_cards(payload: CardRefineRequest):
    try:
        return await gemini_service.refine_cards(payload)
    except GeminiServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Card refinement failed: {str(e)}"
        )

@router.put("/{card_id}", response_model=CardResponse)
def update_card(card_id: str, payload: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)

    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    db.delete(card)
    db.commit()
    return None
