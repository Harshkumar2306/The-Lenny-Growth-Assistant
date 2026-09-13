from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List
import uuid

from app.core.database import get_db
from app.models.db_models import ChatSession, ChatMessage, ChatArtifact
from app.schemas.chat_schemas import SessionCreate, SessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("", response_model=List[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ChatSession, func.count(ChatMessage.id).label("msg_count"))
        .outerjoin(ChatMessage, ChatMessage.session_id == ChatSession.id)
        .group_by(ChatSession.id)
        .order_by(desc(ChatSession.updated_at))
    )
    result = await db.execute(stmt)
    rows = result.all()

    session_responses = []
    for s, count in rows:
        session_responses.append(SessionResponse(
            id=s.id,
            title=s.title,
            provider=s.provider,
            model_name=s.model_name,
            user_metadata=s.user_metadata or {},
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=count
        ))
    return session_responses

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = ChatSession(
        id=str(uuid.uuid4()),
        title=payload.title or "New Strategy Session",
        provider=payload.provider or "ollama",
        model_name=payload.model_name or "llama3.2:1b",
        user_metadata=payload.user_metadata or {}
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)

@router.get("/{session_id}", response_model=dict)
async def get_session_history(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    messages_res = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    )
    messages = messages_res.scalars().all()

    artifacts_res = await db.execute(
        select(ChatArtifact).where(ChatArtifact.session_id == session_id).order_by(ChatArtifact.created_at)
    )
    artifacts = artifacts_res.scalars().all()

    return {
        "session": SessionResponse(
            id=session.id,
            title=session.title,
            provider=session.provider,
            model_name=session.model_name,
            user_metadata=session.user_metadata or {},
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=len(messages),
        ),
        "messages": [
            {
                "id": m.id,
                "session_id": m.session_id,
                "role": m.role,
                "content": m.content,
                "citations": m.citations or [],
                "created_at": m.created_at.isoformat()
            }
            for m in messages
        ],
        "artifacts": [
            {
                "id": a.id,
                "session_id": a.session_id,
                "message_id": a.message_id,
                "artifact_type": a.artifact_type,
                "title": a.title,
                "content": a.content,
                "created_at": a.created_at.isoformat()
            }
            for a in artifacts
        ]
    }

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return None
