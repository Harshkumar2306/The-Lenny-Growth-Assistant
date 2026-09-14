import pytest
import uuid
from sqlalchemy import select
from app.core.database import _sessionmaker
from app.models.db_models import ChatSession, ChatMessage, ChatArtifact

@pytest.mark.asyncio
async def test_database_persistence_hierarchy():
    from app.core.database import init_db_engine, create_tables
    await init_db_engine()
    await create_tables()
    from app.core.database import _sessionmaker
    async with _sessionmaker() as db:
        session_id = str(uuid.uuid4())
        session = ChatSession(
            id=session_id,
            title="Persistence Test Session",
            provider="ollama",
            model_name="llama3.2:1b",
            user_metadata={"client": "evaluator"}
        )
        db.add(session)
        await db.commit()

        # Add message with citations JSON
        msg_id = str(uuid.uuid4())
        citations = [
            {
                "guest": "Casey Winters",
                "title": "Growth Loops",
                "timestamp": "00:12:30",
                "quote": "Retention is the foundation of growth."
            }
        ]
        msg = ChatMessage(
            id=msg_id,
            session_id=session_id,
            role="assistant",
            content="According to Casey Winters on Lenny's Podcast...",
            citations=citations
        )
        db.add(msg)
        await db.commit()

        # Add artifact
        art_id = str(uuid.uuid4())
        art = ChatArtifact(
            id=art_id,
            session_id=session_id,
            message_id=msg_id,
            artifact_type="markdown",
            title="Growth Framework",
            content="# Growth Loops Checklist"
        )
        db.add(art)
        await db.commit()

        # Verify query with relationships
        res_sess = await db.get(ChatSession, session_id)
        assert res_sess is not None
        assert res_sess.title == "Persistence Test Session"

        res_msg = await db.get(ChatMessage, msg_id)
        assert res_msg is not None
        assert res_msg.citations[0]["guest"] == "Casey Winters"

        res_art = await db.get(ChatArtifact, art_id)
        assert res_art is not None
        assert res_art.title == "Growth Framework"

        # Clean up test artifacts to keep database pristine
        await db.delete(res_art)
        await db.delete(res_msg)
        await db.delete(res_sess)
        await db.commit()


@pytest.mark.asyncio
async def test_assistant_turn_persistence_with_artifacts():
    from app.core.database import init_db_engine, create_tables, _sessionmaker
    from app.api.chat import _persist_assistant_turn
    from app.api.sessions import get_session_history

    await init_db_engine()
    await create_tables()

    session_id = str(uuid.uuid4())
    async with _sessionmaker() as db:
        session = ChatSession(
            id=session_id,
            title="Artifact Persistence Test",
            provider="ollama",
            model_name="llama3.2:1b"
        )
        db.add(session)
        await db.commit()

        # Turn 1: Ship 30 Essay artifact
        art1_id = str(uuid.uuid4())
        await _persist_assistant_turn(
            session_id=session_id,
            message="Write a Ship 30 essay on Julie Zhuo's North Star Metrics",
            full_reply="Here is your Ship 30 essay on North Star Metrics.",
            citations_data=[{"guest": "Julie Zhuo", "title": "North Star Metrics"}],
            artifacts=[{
                "id": art1_id,
                "artifact_type": "markdown",
                "title": "The North Star Trap",
                "content": "# The North Star Trap\n\nMost early-stage teams measure vanity..."
            }]
        )

        # Turn 2: Interactive HTML prototype
        art2_id = str(uuid.uuid4())
        await _persist_assistant_turn(
            session_id=session_id,
            message="Build an interactive HTML/CSS PLG Loop simulator",
            full_reply="### Interactive Prototype: Elena Verna's PLG Flywheel Simulator",
            citations_data=[{"guest": "Elena Verna", "title": "PLG Loops"}],
            artifacts=[{
                "id": art2_id,
                "artifact_type": "html",
                "title": "Elena Verna's PLG Flywheel Simulator",
                "content": "<!DOCTYPE html><html><body>Simulator</body></html>"
            }]
        )

        # Query session history (as frontend does on done)
        history = await get_session_history(session_id, db)
        assert len(history["messages"]) == 2, "Both assistant turns must be persisted"
        assert len(history["artifacts"]) == 2, "Both deliverables must be retained across turns"

        types = [a["artifact_type"] for a in history["artifacts"]]
        assert "markdown" in types, "Turn 1 Ship 30 artifact must be retained"
        assert "html" in types, "Turn 2 HTML simulator artifact must be retained"

        # Cleanup
        for a in await db.scalars(select(ChatArtifact).where(ChatArtifact.session_id == session_id)):
            await db.delete(a)
        for m in await db.scalars(select(ChatMessage).where(ChatMessage.session_id == session_id)):
            await db.delete(m)
        sess = await db.get(ChatSession, session_id)
        if sess:
            await db.delete(sess)
        await db.commit()

