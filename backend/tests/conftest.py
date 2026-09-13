"""
Hermetic test bootstrap.

The test suite must never depend on repository build artifacts (the 50 MB+
search index) or the developer's real database:

- DATABASE_URL is pointed at a throwaway SQLite file per test session.
- If the search index is missing, a small index (25 episodes) is built into a
  temp directory and the app is pointed at it via environment variables.
- Global settings mutated by tests (active provider, API keys) are snapshotted
  and restored between tests.

All of this happens BEFORE `app` is imported, because Settings and the
RAGEngine singleton load their configuration at import time.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

_TMPDIR = tempfile.mkdtemp(prefix="lenny-tests-")

# --- Database: isolated temp SQLite --------------------------------------
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMPDIR}/test_units.db"

# --- Search index: build a small one if the repo doesn't have one ---------
os.environ.setdefault(
    "SEARCH_INDEX_PATH",
    str(REPO_ROOT / "data" / "search_index.pkl"),
)

def _index_exists() -> bool:
    p = Path(os.environ["SEARCH_INDEX_PATH"])
    return p.exists() and p.stat().st_size > 1024 * 1024

def _build_mini_index() -> str:
    mini_dir = Path(_TMPDIR) / "mini_index"
    mini_dir.mkdir(parents=True, exist_ok=True)
    mini_pkl = mini_dir / "search_index.pkl"
    mini_json = mini_dir / "transcripts_index.json"

    env = dict(os.environ)
    env["LENNY_SEARCH_PKL"] = str(mini_pkl)
    env["LENNY_INDEX_JSON"] = str(mini_json)

    subprocess.run(
        [sys.executable, str(BACKEND_DIR / "scripts" / "ingest.py"), "25"],
        cwd=REPO_ROOT,
        env=env,
        check=True,
        capture_output=True,
        timeout=300,
    )
    # Point the app at the mini index instead of the (missing) repo index.
    os.environ["SEARCH_INDEX_PATH"] = str(mini_pkl)
    return str(mini_pkl)


if not _index_exists():
    _build_mini_index()

sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
from app.core.database import init_db_engine, create_tables  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.services.llm_gateway import llm_gateway  # noqa: E402

# Snapshot mutable settings so tests can't leak state into each other.
_SETTINGS_SNAPSHOT = {
    "ACTIVE_PROVIDER": settings.ACTIVE_PROVIDER,
    "ACTIVE_MODEL": settings.ACTIVE_MODEL,
    "DEFAULT_LOCAL_MODEL": settings.DEFAULT_LOCAL_MODEL,
    "DEFAULT_GROQ_MODEL": settings.DEFAULT_GROQ_MODEL,
    "GROQ_API_KEY": settings.GROQ_API_KEY,
    "ANTHROPIC_API_KEY": settings.ANTHROPIC_API_KEY,
    "OPENAI_API_KEY": settings.OPENAI_API_KEY,
    "OLLAMA_BASE_URL": settings.OLLAMA_BASE_URL,
}


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    await init_db_engine()
    await create_tables()
    yield


@pytest.fixture(autouse=True)
def restore_settings():
    """Restore global settings after every test (endpoints mutate them)."""
    yield
    for key, value in _SETTINGS_SNAPSHOT.items():
        setattr(settings, key, value)
    llm_gateway.custom_models.clear()


@pytest.fixture
async def async_client():
    import httpx
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        yield client


def pytest_sessionfinish(session, exitstatus):
    shutil.rmtree(_TMPDIR, ignore_errors=True)
