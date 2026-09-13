from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from app.core.database import get_db, get_sessionmaker
from app.models.db_models import ChatSession, ChatMessage, ChatArtifact
from app.schemas.chat_schemas import ChatRequest
from app.services.agent import agent_service
from app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["chat"])

DEFAULT_SESSION_TITLE = "New Strategy Session"


async def _resolve_or_create_session(payload: ChatRequest, db: AsyncSession) -> ChatSession:
    session = None
    if payload.session_id:
        session = await db.get(ChatSession, payload.session_id)

    if not session:
        title = payload.message.strip()[:60]
        if len(payload.message.strip()) > 60:
            title += "..."
        session = ChatSession(
            id=str(uuid.uuid4()),
            title=title,
            provider=payload.provider or "ollama",
            model_name=payload.model or "llama3.2:1b"
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
    return session


async def _persist_assistant_turn(
    session_id: str,
    message: str,
    full_reply: str,
    citations_data: list,
    artifacts: list,
) -> None:
    """Persist the assistant turn + artifacts, then touch the session timestamp.

    Called BEFORE the final 'done' event is emitted so the frontend's
    refresh-after-done can never race ahead of the database write.
    """
    sessionmaker = get_sessionmaker()
    if not sessionmaker:
        logger.warning("No DB sessionmaker available; assistant turn not persisted.")
        return
    async with sessionmaker() as save_db:
        assistant_msg = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=full_reply,
            citations=citations_data,
            token_count=max(1, len(full_reply) // 4) if full_reply else 0,
        )
        save_db.add(assistant_msg)
        await save_db.flush()

        for art in artifacts:
            save_db.add(ChatArtifact(
                id=art.get("id", str(uuid.uuid4())),
                session_id=session_id,
                message_id=assistant_msg.id,
                artifact_type=art.get("artifact_type", "markdown"),
                title=art.get("title", "Artifact"),
                content=art.get("content", "")
            ))

        sess = await save_db.get(ChatSession, session_id)
        if sess:
            if sess.title == DEFAULT_SESSION_TITLE:
                sess.title = message.strip()[:60]
            sess.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        await save_db.commit()


@router.post("")
async def send_chat_message(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Resolve or create session
    session = await _resolve_or_create_session(payload, db)
    session_id = session.id

    # 2. Persist user message
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=payload.message,
        citations=[],
        token_count=max(1, len(payload.message) // 4) if payload.message else 0,
    )
    db.add(user_msg)
    session.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()

    # 3. Conversation history for context (excludes the just-persisted user message)
    history_res = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    )
    history_rows = history_res.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in history_rows[:-1]]

    # 4. Non-streaming contract: same data as SSE, but as a single JSON object.
    if not payload.stream:
        return await _run_non_streaming(payload, session, history)

    # 5. SSE stream generator
    async def event_generator() -> AsyncGenerator[str, None]:
        full_assistant_reply = ""
        citations_data = []
        created_artifacts = []
        done_data = None

        try:
            yield f"data: {json.dumps({'type': 'session_init', 'data': {'session_id': session_id, 'title': session.title}}, default=str)}\n\n"

            async for event in agent_service.process_chat(
                message=payload.message,
                history=history,
                provider=payload.provider,
                model=payload.model,
                skill=payload.skill,
                session_id=session_id
            ):
                event_type = event["type"]
                event_data = event["data"]

                if event_type == "token":
                    full_assistant_reply += event_data
                elif event_type == "citations":
                    citations_data = event_data
                elif event_type == "artifact":
                    created_artifacts.append(event_data)
                elif event_type == "done":
                    done_data = event_data

                if event_type == "done":
                    # Persist BEFORE acknowledging completion so clients that
                    # refresh on 'done' always observe the assistant turn.
                    # (Zero-content turns, e.g. a provider preflight error,
                    # are not persisted — the user message is already saved.)
                    try:
                        if full_assistant_reply:
                            await _persist_assistant_turn(
                                session_id=session_id,
                                message=payload.message,
                                full_reply=full_assistant_reply,
                                citations_data=citations_data,
                                artifacts=created_artifacts,
                            )
                            done_data = {**done_data, "persisted": True}
                        else:
                            done_data = {**done_data, "persisted": False}
                    except Exception as e:
                        logger.error(f"Failed to persist assistant turn: {type(e).__name__}: {e}")
                        done_data = {**done_data, "persisted": False}

                yield f"data: {json.dumps(event if event_type != 'done' else {'type': 'done', 'data': done_data}, default=str)}\n\n"

        except Exception as e:
            logger.error(f"Error in chat SSE streaming: {type(e).__name__}: {e}")
            yield f"data: {json.dumps({'type': 'error', 'data': 'The assistant encountered an internal error. Check the backend logs.'}, default=str)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


async def _run_non_streaming(payload: ChatRequest, session: ChatSession, history: list):
    """Collect the agent events and return them as one JSON response."""
    full_reply = ""
    citations_data = []
    created_artifacts = []
    status_events = []
    error = None
    done_data = None

    async for event in agent_service.process_chat(
        message=payload.message,
        history=history,
        provider=payload.provider,
        model=payload.model,
        skill=payload.skill,
        session_id=session.id
    ):
        event_type = event["type"]
        if event_type == "token":
            full_reply += event["data"]
        elif event_type == "citations":
            citations_data = event["data"]
        elif event_type == "artifact":
            created_artifacts.append(event["data"])
        elif event_type == "status":
            status_events.append(event["data"])
        elif event_type == "error":
            error = event["data"]
        elif event_type == "done":
            done_data = event["data"]

    persisted = False
    if full_reply:
        try:
            await _persist_assistant_turn(
                session_id=session.id,
                message=payload.message,
                full_reply=full_reply,
                citations_data=citations_data,
                artifacts=created_artifacts,
            )
            persisted = True
        except Exception as e:
            logger.error(f"Failed to persist assistant turn: {type(e).__name__}: {e}")

    return JSONResponse({
        "session_id": session.id,
        "title": session.title,
        "content": full_reply,
        "citations": citations_data,
        "artifacts": created_artifacts,
        "status_updates": status_events,
        "error": error,
        "suggestions": (done_data or {}).get("suggestions", []),
        "rejection": (done_data or {}).get("rejection", False),
        "persisted": persisted,
    })
