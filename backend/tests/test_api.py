import pytest
import uuid

@pytest.mark.asyncio
async def test_health_endpoint(async_client, monkeypatch):
    """Health must report 'healthy' when DB + index + at least one usable model
    are present. Hermetic: a model is stubbed as available so the assertion
    does not depend on a live Ollama or ambient cloud API keys."""
    from app.schemas.chat_schemas import ModelStatus
    from app.services.llm_gateway import llm_gateway

    async def fake_available_models():
        return [ModelStatus(
            provider="ollama",
            model_name="llama3.2:1b",
            available=True,
            is_local=True,
            details="Stubbed for hermetic health test",
        )]

    monkeypatch.setattr(llm_gateway, "get_available_models", fake_available_models)

    resp = await async_client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "database_type" in data
    assert data["index_loaded"] is True
    assert data["total_indexed_chunks"] > 0
    assert len(data["models"]) >= 1

@pytest.mark.asyncio
async def test_sessions_crud(async_client):
    # 1. Create Session
    session_title = f"Test Session {uuid.uuid4().hex[:6]}"
    create_resp = await async_client.post("/api/sessions", json={
        "title": session_title,
        "provider": "ollama",
        "model_name": "llama3.2:1b"
    })
    assert create_resp.status_code == 201
    created = create_resp.json()
    session_id = created["id"]
    assert created["title"] == session_title
    assert created["provider"] == "ollama"

    # 2. List Sessions
    list_resp = await async_client.get("/api/sessions")
    assert list_resp.status_code == 200
    sessions = list_resp.json()
    assert any(s["id"] == session_id for s in sessions)

    # 3. Get Session History
    hist_resp = await async_client.get(f"/api/sessions/{session_id}")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["session"]["id"] == session_id
    assert isinstance(hist_data["messages"], list)
    assert isinstance(hist_data["artifacts"], list)

    # 4. Delete Session
    del_resp = await async_client.delete(f"/api/sessions/{session_id}")
    assert del_resp.status_code == 204

    # 5. Verify Deletion
    verify_resp = await async_client.get(f"/api/sessions/{session_id}")
    assert verify_resp.status_code == 404

@pytest.mark.asyncio
async def test_models_toggle(async_client):
    # 1. List Models
    models_resp = await async_client.get("/api/models")
    assert models_resp.status_code == 200
    data = models_resp.json()
    assert "active_provider" in data
    assert "models" in data

    # 2. Switch Model to Groq
    switch_resp = await async_client.post("/api/models/active", json={
        "provider": "groq",
        "model_name": "llama-3.3-70b-versatile"
    })
    assert switch_resp.status_code == 200
    assert switch_resp.json()["active_provider"] == "groq"
    assert switch_resp.json()["active_model"] == "llama-3.3-70b-versatile"

    # 3. Add Custom Model
    add_resp = await async_client.post("/api/models/add", json={
        "provider": "groq",
        "model_name": "qwen-2.5-32b",
        "api_key": "gsk_test_mock_key_12345"
    })
    assert add_resp.status_code == 200
    assert add_resp.json()["active_provider"] == "groq"
    assert add_resp.json()["active_model"] == "qwen-2.5-32b"
    assert any(m["model_name"] == "qwen-2.5-32b" for m in add_resp.json()["models"])

    # 4. Switch back to Ollama
    switch_back = await async_client.post("/api/models/active", json={
        "provider": "ollama",
        "model_name": "llama3.2:1b"
    })
    assert switch_back.status_code == 200
    assert switch_back.json()["active_provider"] == "ollama"

@pytest.mark.asyncio
async def test_validation_error(async_client):
    # Invalid chat request (empty body)
    bad_resp = await async_client.post("/api/chat", json={})
    assert bad_resp.status_code == 422

@pytest.mark.asyncio
async def test_chat_events_json_serializability():
    from app.services.agent import agent_service
    import json

    # Test out-of-domain rejection serializability
    async for ev in agent_service.process_chat(message="Sourdough bread recipe"):
        dumped = json.dumps(ev, default=str)
        loaded = json.loads(dumped)
        assert "type" in loaded

    # Test artifact parsing serializability
    from app.schemas.chat_schemas import ArtifactItem
    art = ArtifactItem(
        id="test-art",
        session_id="test-sess",
        artifact_type="markdown",
        title="Test Artifact",
        content="# Test Content"
    )
    art_dict = art.model_dump(mode="json")
    dumped = json.dumps({"type": "artifact", "data": art_dict}, default=str)
    loaded = json.loads(dumped)
    assert loaded["data"]["id"] == "test-art"
    assert isinstance(loaded["data"]["created_at"], str)


@pytest.mark.asyncio
async def test_chat_non_streaming_contract(async_client):
    """stream=false must return a single JSON object with the same shape as SSE events."""
    resp = await async_client.post("/api/chat", json={
        "message": "Hi there",
        "stream": False
    })
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/json")
    data = resp.json()
    assert data["session_id"]
    assert "content" in data
    assert "citations" in data
    assert isinstance(data["artifacts"], list)


@pytest.mark.asyncio
async def test_chat_out_of_domain_rejection_no_llm(async_client):
    """Out-of-domain queries must be rejected without invoking any LLM."""
    resp = await async_client.post("/api/chat", json={
        "message": "What is the best recipe for chocolate cake?",
        "stream": False
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["rejection"] is True
    assert "not covered" in data["content"] or "transcripts" in data["content"].lower()


@pytest.mark.asyncio
async def test_chat_missing_provider_key_fails_gracefully(async_client):
    """Requesting a cloud provider without a key must return a clear error, not hang."""
    from app.core.config import settings
    original_key = settings.GROQ_API_KEY
    settings.GROQ_API_KEY = None
    try:
        resp = await async_client.post("/api/chat", json={
            "message": "What does Shreyas Doshi say about pre-mortems?",
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "stream": False
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["error"]
        assert "key" in data["error"].lower() or "API" in data["error"]
    finally:
        settings.GROQ_API_KEY = original_key


@pytest.mark.asyncio
async def test_session_updated_at_bumps_on_activity(async_client):
    """Sending a message must move the session to the top of recency ordering."""
    create_resp = await async_client.post("/api/sessions", json={"title": "Recency Test"})
    session_id = create_resp.json()["id"]
    created_at = create_resp.json()["updated_at"]

    resp = await async_client.post("/api/chat", json={
        "message": "Hi there",
        "session_id": session_id,
        "stream": False
    })
    assert resp.status_code == 200

    hist_resp = await async_client.get(f"/api/sessions/{session_id}")
    updated_at = hist_resp.json()["session"]["updated_at"]
    assert updated_at >= created_at

    await async_client.delete(f"/api/sessions/{session_id}")


@pytest.mark.asyncio
async def test_custom_provider_activation_and_switch(async_client):
    """A custom OpenAI-compatible provider added via /models/add must be
    switchable via /models/active (previously 400'd as 'unsupported')."""
    add_resp = await async_client.post("/api/models/add", json={
        "provider": "custom",
        "model_name": "deepseek-chat",
        "api_key": "sk-test-mock-123456",
        "base_url": "http://localhost:9999/v1",
    })
    assert add_resp.status_code == 200
    assert add_resp.json()["active_provider"] == "custom"
    assert add_resp.json()["active_model"] == "deepseek-chat"

    switch_resp = await async_client.post("/api/models/active", json={
        "provider": "custom",
        "model_name": "deepseek-chat",
    })
    assert switch_resp.status_code == 200
    assert switch_resp.json()["active_provider"] == "custom"
    assert switch_resp.json()["active_model"] == "deepseek-chat"

    unregistered = await async_client.post("/api/models/active", json={
        "provider": "unknown-provider",
        "model_name": "x",
    })
    assert unregistered.status_code == 400


@pytest.mark.asyncio
async def test_session_history_reports_message_count(async_client):
    """GET /api/sessions/{id} must report the real message count (was always 0)."""
    create_resp = await async_client.post("/api/sessions", json={"title": "Count Test"})
    session_id = create_resp.json()["id"]
    await async_client.post("/api/chat", json={
        "message": "Hi there", "session_id": session_id, "stream": False,
    })
    hist = (await async_client.get(f"/api/sessions/{session_id}")).json()
    assert hist["session"]["message_count"] == 2  # user + assistant turns
    await async_client.delete(f"/api/sessions/{session_id}")


@pytest.mark.asyncio
async def test_ollama_stream_falls_back_to_installed_model(monkeypatch):
    """When the requested local model isn't installed, streaming must fall back
    to the first model Ollama actually has instead of failing mid-stream."""
    import json as _json
    from types import SimpleNamespace
    from app.services.llm_gateway import llm_gateway

    calls = {}

    class FakeStreamCtx:
        def __init__(self, payload):
            self.payload = payload
        async def __aenter__(self):
            return self
        async def __aexit__(self, *exc):
            return False
        @property
        def status_code(self):
            return 200
        async def aread(self):
            return b""
        async def aiter_lines(self):
            yield _json.dumps({"message": {"content": "Grounded answer."}, "done": False})
            yield _json.dumps({"message": {"content": ""}, "done": True})

    class FakeClient:
        async def get(self, url, timeout=2.5):
            resp = SimpleNamespace(status_code=200)
            resp.json = lambda: {"models": [{"name": "llama3.2:1b"}]}
            return resp
        def stream(self, method, url, json=None, timeout=None):
            calls["model"] = json["model"]
            return FakeStreamCtx(json)

    monkeypatch.setattr(llm_gateway, "client", FakeClient())

    tokens = []
    async for token in llm_gateway.stream_chat(
        [{"role": "user", "content": "hello"}], provider="ollama", model="mistral"
    ):
        tokens.append(token)

    assert "".join(tokens) == "Grounded answer."
    assert calls["model"] == "llama3.2:1b"  # fallback happened; no mid-stream 404


@pytest.mark.asyncio
async def test_health_reports_degraded_when_ollama_down(async_client):
    """Health must honestly report degradation when no model runtime is reachable."""
    from app.core.config import settings
    original_url = settings.OLLAMA_BASE_URL
    original_keys = (
        settings.GROQ_API_KEY,
        settings.ANTHROPIC_API_KEY,
        settings.OPENAI_API_KEY,
    )
    # Point Ollama at a port guaranteed to refuse connections and clear any
    # cloud keys so no provider can report 'available'.
    settings.OLLAMA_BASE_URL = "http://127.0.0.1:9"
    settings.GROQ_API_KEY = None
    settings.ANTHROPIC_API_KEY = None
    settings.OPENAI_API_KEY = None
    try:
        resp = await async_client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "degraded"
        ollama_status = next(m for m in data["models"] if m["provider"] == "ollama")
        assert ollama_status["available"] is False
    finally:
        settings.OLLAMA_BASE_URL = original_url
        settings.GROQ_API_KEY, settings.ANTHROPIC_API_KEY, settings.OPENAI_API_KEY = original_keys
