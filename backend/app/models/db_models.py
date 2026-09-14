import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    """Return naive UTC timestamp for SQLAlchemy DateTime columns without deprecation warnings."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="New Strategy Session")
    provider = Column(String(50), nullable=False, default="ollama")
    model_name = Column(String(100), nullable=False, default="llama3.2:1b")
    user_metadata = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    artifacts = relationship("ChatArtifact", back_populates="session", cascade="all, delete-orphan", order_by="ChatArtifact.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True, default=list)  # list of source citations
    token_count = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, default=utc_now)

    session = relationship("ChatSession", back_populates="messages")
    artifacts = relationship("ChatArtifact", back_populates="message")

class ChatArtifact(Base):
    __tablename__ = "chat_artifacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(String(36), ForeignKey("chat_messages.id", ondelete="SET NULL"), nullable=True)
    artifact_type = Column(String(20), nullable=False)  # "markdown", "html"
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)

    session = relationship("ChatSession", back_populates="artifacts")
    message = relationship("ChatMessage", back_populates="artifacts")
