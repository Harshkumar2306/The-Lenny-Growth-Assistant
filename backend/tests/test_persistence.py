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
