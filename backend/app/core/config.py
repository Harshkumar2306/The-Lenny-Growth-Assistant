from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "The Lenny Growth Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database configuration (PostgreSQL with resilient SQLite fallback)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_assistant",
        description="Async database connection string. Falls back to SQLite if PostgreSQL is unreachable."
    )
    SQLITE_FALLBACK_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/data/lenny_fallback.db"

    # LLM Providers
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_LOCAL_MODEL: str = "llama3.2:1b"
    
    GROQ_API_KEY: Optional[str] = None
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    DEFAULT_GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Default runtime provider & model
    ACTIVE_PROVIDER: str = "ollama"  # "ollama" | "groq" | "anthropic" | "openai"
    ACTIVE_MODEL: str = "llama3.2:1b"

    # Search & RAG Paths
    SEARCH_INDEX_PATH: str = str(BASE_DIR / "data" / "search_index.pkl")

    # CORS — explicit allow-list only. Wildcard origins are invalid in combination
    # with credentialed requests, so we never ship "*".
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

settings = Settings()
