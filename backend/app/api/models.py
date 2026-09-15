from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.llm_gateway import (
    llm_gateway,
    SUPPORTED_PROVIDERS,
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_OPENAI_MODEL,
    LLMProviderError,
)
from app.schemas.chat_schemas import ModelStatus

router = APIRouter(prefix="/models", tags=["models"])

class SetActiveModelRequest(BaseModel):
    provider: str
    model_name: Optional[str] = None

class ModelToggleResponse(BaseModel):
    active_provider: str
    active_model: str
    models: List[ModelStatus]

@router.get("", response_model=Dict[str, Any])
async def list_models():
    models = await llm_gateway.get_available_models()
    return {
        "active_provider": settings.ACTIVE_PROVIDER,
        "active_model": settings.ACTIVE_MODEL,
        "models": [m.model_dump() for m in models]
    }

@router.post("/active", response_model=Dict[str, Any])
async def switch_active_model(payload: SetActiveModelRequest):
    provider = payload.provider.lower()
    model_name = payload.model_name

    # OpenAI-compatible custom providers registered via /models/add are fully
    # switchable at runtime; the UI treats them as first-class providers.
    custom_info = llm_gateway.custom_models.get(f"{provider}:{model_name}") if model_name else None
    is_custom_provider = provider not in SUPPORTED_PROVIDERS
    if custom_info is None and is_custom_provider:
        custom_info = next(
            (v for v in llm_gateway.custom_models.values() if v["provider"] == provider),
            None,
        )

    if provider not in SUPPORTED_PROVIDERS and custom_info is None:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}. Supported: {', '.join(sorted(SUPPORTED_PROVIDERS))}")

    if custom_info is not None:
        settings.ACTIVE_MODEL = model_name or custom_info["model_name"]
    elif provider == "ollama":
        if model_name:
            # Prefer the requested model; fall back to the configured default.
            settings.DEFAULT_LOCAL_MODEL = model_name
        settings.ACTIVE_MODEL = model_name or settings.DEFAULT_LOCAL_MODEL
    elif provider == "groq":
        settings.ACTIVE_MODEL = model_name or settings.DEFAULT_GROQ_MODEL
    elif provider == "anthropic":
        settings.ACTIVE_MODEL = model_name or DEFAULT_ANTHROPIC_MODEL
    elif provider == "openai":
        settings.ACTIVE_MODEL = model_name or DEFAULT_OPENAI_MODEL

    settings.ACTIVE_PROVIDER = provider

    models = await llm_gateway.get_available_models()
    return {
        "message": f"Switched to {provider} ({settings.ACTIVE_MODEL})",
        "active_provider": settings.ACTIVE_PROVIDER,
        "active_model": settings.ACTIVE_MODEL,
        "models": [m.model_dump() for m in models]
    }

class AddCustomModelRequest(BaseModel):
    provider: str
    model_name: str
    api_key: str
    base_url: Optional[str] = None

@router.post("/add", response_model=Dict[str, Any])
async def add_custom_model(payload: AddCustomModelRequest):
    provider = payload.provider.strip().lower()
    model_name = payload.model_name.strip()
    api_key = payload.api_key.strip()
    base_url = payload.base_url.strip() if payload.base_url else None

    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")
    if len(api_key) <= 5:
        raise HTTPException(status_code=400, detail="API key looks invalid (too short)")

    try:
        status = llm_gateway.register_custom_model(
            provider=provider,
            model_name=model_name,
            api_key=api_key,
            base_url=base_url
        )
    except LLMProviderError as e:
        raise HTTPException(status_code=400, detail=e.message)

    settings.ACTIVE_PROVIDER = provider
    settings.ACTIVE_MODEL = model_name

    models = await llm_gateway.get_available_models()
    return {
        "status": "success",
        "message": f"Added and activated {provider} model: {model_name}",
        "active_provider": settings.ACTIVE_PROVIDER,
        "active_model": settings.ACTIVE_MODEL,
        "models": [m.model_dump() for m in models]
    }

@router.post("/configure", response_model=Dict[str, Any])
async def configure_provider_key(payload: Dict[str, str]):
    provider = payload.get("provider", "").lower()
    api_key = payload.get("api_key", "").strip()

    if provider not in ("groq", "anthropic", "openai"):
        raise HTTPException(status_code=400, detail="Provider does not require an API key or is unsupported")
    if len(api_key) <= 5:
        raise HTTPException(status_code=400, detail="API key looks invalid (too short)")

    if provider == "groq":
        settings.GROQ_API_KEY = api_key
    elif provider == "anthropic":
        settings.ANTHROPIC_API_KEY = api_key
    elif provider == "openai":
        settings.OPENAI_API_KEY = api_key

    models = await llm_gateway.get_available_models()
    return {
        "status": "success",
        "message": f"Updated credentials for {provider}",
        "active_provider": settings.ACTIVE_PROVIDER,
        "models": [m.model_dump() for m in models]
    }

class RemoveCustomModelRequest(BaseModel):
    provider: str
    model_name: str

@router.delete("/remove", response_model=Dict[str, Any])
async def remove_custom_model_endpoint(payload: RemoveCustomModelRequest):
    provider = payload.provider.strip().lower()
    model_name = payload.model_name.strip()
    
    success = llm_gateway.remove_custom_model(provider, model_name)
    if not success:
        raise HTTPException(status_code=404, detail="Custom model not found.")
        
    # If we just removed the active model, fallback to default Ollama
    if settings.ACTIVE_PROVIDER == provider and settings.ACTIVE_MODEL == model_name:
        settings.ACTIVE_PROVIDER = "ollama"
        settings.ACTIVE_MODEL = settings.DEFAULT_LOCAL_MODEL
        
    models = await llm_gateway.get_available_models()
    return {
        "status": "success",
        "message": f"Removed model {model_name}",
        "active_provider": settings.ACTIVE_PROVIDER,
        "active_model": settings.ACTIVE_MODEL,
        "models": [m.model_dump() for m in models]
    }
