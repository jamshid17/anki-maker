import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Deck(Base):
    __tablename__ = "decks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), default="local-user", nullable=False, index=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(32), default="text", nullable=False) # 'text' | 'url'
    source_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan", order_by="Card.order_index")
