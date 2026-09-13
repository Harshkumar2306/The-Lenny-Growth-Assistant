from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.db_models import ChatArtifact
from app.schemas.chat_schemas import ArtifactItem

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.get("/{artifact_id}", response_model=ArtifactItem)
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    artifact = await db.get(ChatArtifact, artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")
    return ArtifactItem.model_validate(artifact)

@router.get("/session/{session_id}", response_model=List[ArtifactItem])
async def get_session_artifacts(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatArtifact).where(ChatArtifact.session_id == session_id).order_by(ChatArtifact.created_at)
    )
    artifacts = result.scalars().all()
    return [ArtifactItem.model_validate(a) for a in artifacts]
