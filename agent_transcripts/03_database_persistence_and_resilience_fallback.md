# Agent Transcript 03: Persistence & Database Resilience Fallback

**Phase:** Backend & Persistence  
**Date:** 2026-09-12  
**Status:** Completed  

---

## 1. Failed Attempt: Greenlet Missing Dependency & SQLite No-Table Bug
During the first test of `create_tables()` via SQLAlchemy async engine, two errors occurred:

### Error 1: Missing Greenlet
```
ValueError: the greenlet library is required to use this function. No module named 'greenlet'
```
- **Cause:** SQLAlchemy 2.0's async engine relies on `greenlet` to bridge async calls with synchronous DB-API drivers.
- **Correction:** Installed `greenlet>=3.0.0` into `.venv` and updated `backend/requirements.txt`.

### Error 2: Missing Tables on Unhandled Lifespan
```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such table: chat_sessions
```
- **Cause:** In isolated unit tests that didn't invoke the FastAPI lifespan context, `create_tables()` was not executed before queries ran.
- **Correction:** Added automatic table initialization inside `get_db()`:
  ```python
  if not _tables_created:
      await create_tables()
      _tables_created = True
  ```

## 2. Resilient Database Architecture
Section 5 mandates:
> *"Resilience: Handle missing keys, unavailable Ollama, model timeouts, empty retrieval results, and database connection failures gracefully."*

In `backend/app/core/database.py`:
- Attempts connection to PostgreSQL at `DATABASE_URL`.
- If connection fails (`Errno 61` Connection refused or timeout), logs:
  `{"level": "WARNING", "message": "PostgreSQL connection failed. Activating resilient SQLite fallback: .../data/lenny_fallback.db"}`
- Seamlessly switches to SQLite with zero downtime and persists all sessions, messages, and artifacts.
