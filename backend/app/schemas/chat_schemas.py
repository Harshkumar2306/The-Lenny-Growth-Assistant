from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class CitationItem(BaseModel):
    guest: str
    title: str
    youtube_url: Optional[str] = None
    timestamp: str
    quote: str
    relevance_score: Optional[float] = None

class ArtifactItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    message_id: Optional[str] = None
    artifact_type: str = Field(..., description="'markdown' or 'html'")
    title: str
    content: str
    version: int = 1
    created_at: Optional[datetime] = Field(default_factory=utc_now)

class SessionCreate(BaseModel):
    title: Optional[str] = "New Strategy Session"
    provider: Optional[str] = "ollama"
    model_name: Optional[str] = "llama3.2:1b"
    user_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    provider: str
    model_name: str
    user_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query or instruction")
    session_id: Optional[str] = Field(None, description="Existing session ID or None to start new")
    provider: Optional[str] = Field(None, description="Override LLM provider: 'ollama' or 'groq'")
    model: Optional[str] = Field(None, description="Specific model name")
    skill: Optional[str] = Field("chat", description="'chat', 'ship30', or 'artifact'")
    stream: bool = Field(True, description="Enable Server-Sent Events streaming")

class ModelStatus(BaseModel):
    provider: str
    model_name: str
    available: bool
    is_local: bool
    details: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    database_type: str
    database_connected: bool
    index_loaded: bool
    total_indexed_chunks: int
    active_provider: str
    models: List[ModelStatus]
