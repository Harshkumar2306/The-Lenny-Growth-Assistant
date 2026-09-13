import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text, event
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

_engine = None
_sessionmaker = None
_active_db_type = "unknown"
_tables_created = False
_init_lock = asyncio.Lock()


def _apply_sqlite_pragmas(dbapi_connection, _connection_record):
    """Enable WAL mode + busy timeout for SQLite so concurrent readers/writers
    from the streaming path do not collide with 'database is locked' errors."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.execute("PRAGMA foreign_keys=ON")
    finally:
        cursor.close()


async def init_db_engine():
    global _engine, _sessionmaker, _active_db_type
    async with _init_lock:
        if _engine is not None:
            return

        pg_url = settings.DATABASE_URL

        # Only PostgreSQL goes through the connect-check + fallback dance.
        # Any other scheme (e.g. SQLite configured directly for tests or CI)
        # is used as-is without mislabelling it as Postgres.
        if pg_url.startswith("postgresql"):
            try:
                engine = create_async_engine(
                    pg_url,
                    echo=settings.DEBUG,
                    pool_pre_ping=True,
                    connect_args={"timeout": 3} if "asyncpg" in pg_url else {}
                )
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
                host_part = pg_url.split('@')[-1] if '@' in pg_url else 'configured PG'
                logger.info(f"Connected to PostgreSQL database: {host_part}")
                _engine = engine
                _sessionmaker = async_sessionmaker(bind=_engine, class_=AsyncSession, expire_on_commit=False)
                _active_db_type = "postgresql"
                return
            except Exception as e:
                # Log the failure type, never credentials (the URL may embed a password).
                err_name = type(e).__name__
                logger.warning(
                    f"PostgreSQL connection failed ({err_name}). Activating resilient SQLite fallback: {settings.SQLITE_FALLBACK_URL}"
                )
                try:
                    engine.dispose()
                except Exception:
                    pass

            # Fallback to local SQLite
            sqlite_url = settings.SQLITE_FALLBACK_URL
        else:
            sqlite_url = pg_url

        # Ensure the parent directory exists so a read-only checkout never fails on a missing dir.
        if sqlite_url.startswith("sqlite"):
            db_path = sqlite_url.split("///", 1)[-1]
            if db_path and db_path != ":memory:":
                Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        _engine = create_async_engine(sqlite_url, echo=settings.DEBUG)
        if sqlite_url.startswith("sqlite"):
            event.listen(_engine.sync_engine, "connect", _apply_sqlite_pragmas)
        _sessionmaker = async_sessionmaker(bind=_engine, class_=AsyncSession, expire_on_commit=False)
        _active_db_type = "sqlite" if sqlite_url.startswith("sqlite") else "postgresql"
        logger.info(f"Resilient fallback database active: {_active_db_type}")


async def get_db() -> AsyncSession:
    global _sessionmaker, _tables_created
    if _sessionmaker is None:
        await init_db_engine()
    if not _tables_created:
        await create_tables()
    async with _sessionmaker() as session:
        yield session


async def create_tables():
    global _engine, _tables_created
    if _engine is None:
        await init_db_engine()
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _tables_created = True
    logger.info(f"Database tables verified/created on {_active_db_type}")


def get_active_db_type() -> str:
    return _active_db_type


def get_sessionmaker():
    """Late-binding accessor for the async sessionmaker.

    Do not `from app.core.database import _sessionmaker` — module imports bind
    the name to whatever value it had at import time (usually None), so code
    that snapshots it never sees the engine initialised later.
    """
    return _sessionmaker
