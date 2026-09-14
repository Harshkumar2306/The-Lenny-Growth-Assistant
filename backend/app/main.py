from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables, init_db_engine
from app.core.logging import logger
from app.api.chat import router as chat_router
from app.api.sessions import router as sessions_router
from app.api.models import router as models_router
from app.api.artifacts import router as artifacts_router
from app.api.health import router as health_router
from app.services.llm_gateway import llm_gateway

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing The Lenny Growth Assistant Backend...")
    await init_db_engine()
    await create_tables()
    logger.info("Database & services ready.")
    yield
    logger.info("Shutting down backend services.")
    try:
        await llm_gateway.aclose()
    except Exception as e:
        logger.warning(f"Error closing LLM gateway client: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Grounded AI conversational advisor powered by Lenny's Podcast transcripts with native Artifacts.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(chat_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(models_router, prefix="/api")
app.include_router(artifacts_router, prefix="/api")
app.include_router(health_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Never leak internal exception details to clients; log the full trace locally.
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Check the backend logs for details.",
            "path": request.url.path
        }
    )
