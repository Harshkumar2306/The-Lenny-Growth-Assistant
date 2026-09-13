from fastapi import APIRouter
from app.core.config import settings
from app.core.database import get_active_db_type
from app.services.rag_engine import rag_engine
from app.services.llm_gateway import llm_gateway
from app.schemas.chat_schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
async def check_health():
    models = await llm_gateway.get_available_models()
    db_type = get_active_db_type()
    if db_type == "unknown":
        from app.core.database import init_db_engine
        await init_db_engine()
        db_type = get_active_db_type()

    db_connected = db_type != "unknown"
    index_loaded = rag_engine.index_loaded
    any_model_available = any(m.available for m in models)

    # Honest status: 'healthy' only when every dependency is usable.
    if db_connected and index_loaded and any_model_available:
        status = "healthy"
    else:
        status = "degraded"

    return HealthResponse(
        status=status,
        version=settings.APP_VERSION,
        database_type=db_type,
        database_connected=db_connected,
        index_loaded=index_loaded,
        total_indexed_chunks=len(rag_engine.chunks) if rag_engine.chunks else 0,
        active_provider=settings.ACTIVE_PROVIDER,
        models=models
    )
