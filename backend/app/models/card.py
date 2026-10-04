import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Card(Base):
    __tablename__ = "cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    deck_id = Column(String(36), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    card_type = Column(String(32), default="basic", nullable=False) # 'basic' | 'cloze'
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    tags = Column(JSON, default=list, nullable=False) # e.g. ["biology", "cells"]
    source_context = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    deck = relationship("Deck", back_populates="cards")
