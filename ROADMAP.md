# Project Roadmap & Execution Log — The Lenny Growth Assistant

This document outlines the multi-phase engineering roadmap followed during the development of **The Lenny Growth Assistant** for the Oogway Labs Forward Deployed Engineer (FDE) assessment.

---

## 🗺️ Phase Roadmap

```
Phase 1: Discovery & Ingestion ──▶ Phase 2: Core Agent & RAG ──▶ Phase 3: Artifact Viewer & Skills ──▶ Phase 4: Hardening & Delivery
         [DONE]                                [DONE]                              [DONE]                             [DONE]
```

---

### Phase 1: Discovery & Ingestion Pipeline
- [x] **Discovery Brief**: Defined primary users (PMs, Growth Leads, Founders), JTBD, success metrics, and risk trade-offs (documented in `PRD.md`).
- [x] **Transcript Parser**: Built semantic transcript parser extracting YAML frontmatter, timestamps, and speaker turns from 300+ Lenny's Podcast episodes.
- [x] **Vector & Keyword Indexing**: Designed a hybrid BM25 + TF-IDF semantic search index over 5,993 dialogue chunks with YouTube deep-link time offsets (`&t=...s`).
- [x] **Reproducible Ingestion**: Created `backend/scripts/ingest.py` enabling 10-second automatic index regeneration for fresh clones.

### Phase 2: Core Backend, Grounded RAG & Persistence
- [x] **FastAPI Foundation**: Built structured routers for `/api/chat`, `/api/sessions`, `/api/models`, `/api/artifacts`, and `/api/health`.
- [x] **Dual Persistence Engine**: Async SQLAlchemy implementation targeting PostgreSQL with zero-downtime automatic fallback to SQLite WAL mode (`data/lenny_fallback.db`).
- [x] **Negative Boundary Gating**: Built semantic and lexical coverage gates that detect out-of-domain queries and reject them in ~28ms with zero LLM cost or hallucination.
- [x] **Flexible LLM Gateway**: Unified adapter supporting local Ollama (`llama3.2:1b`) and cloud providers (Groq, Anthropic Claude, OpenAI, and custom OpenAI-compatible endpoints).

### Phase 3: In-App Artifact Viewer & Skills
- [x] **Claude Artifacts Split-Screen Canvas**: Built responsive React 18 / TypeScript workspace rendering rich Markdown and live HTML/CSS/JS side-by-side with chat.
- [x] **Interactive Sandbox Security**: Sandboxed iframe with `sandbox="allow-scripts"` (strictly omitting `allow-same-origin`), DOMPurify sanitization, and CSP isolation.
- [x] **Dedicated Ship 30 for 30 Skill**: Encoded Nicolas Cole & Dickie Bush writing methodology (~1,250 words, magnetic hook, 1-3-1 cadence, bold lead-ins, actionable checklists).
- [x] **Device Viewport Testing**: Integrated 1-click Fluid, Desktop (1024px), Tablet (768px), and Mobile (375px) responsive testing controls.

### Phase 4: Production Hardening & Operational Readiness
- [x] **Hermetic Test Suite**: Authored 34 unit & integration tests (`pytest backend/tests/`) achieving 100% pass rate in <0.5s.
- [x] **1-Command Deployment**: Authored `run.sh` with automatic virtualenv creation, dependency installation, Ollama daemon check, and port collision recovery.
- [x] **Containerization**: Configured multi-container `docker-compose.yml` with PostgreSQL 16 `pgvector`, FastAPI, and Vite reverse proxy.
- [x] **Audit & Verification**: Complete live acceptance testing of Grounded Q&A, PMF Calculator prototype, and Ship 30 essay generation.

---

## 📊 Deliverables Traceability Matrix

| Deliverable | File / Path | Status |
| :--- | :--- | :---: |
| **Public GitHub Repo** | [https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant](https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant) | ✅ Live |
| **README.md** | `README.md` | ✅ Complete |
| **PRD** | `PRD.md` | ✅ Complete |
| **design.md** | `design.md` | ✅ Complete |
| **architecture.md** | `architecture.md` | ✅ Complete |
| **Agent Transcripts** | `agent_transcripts/` (10 files) | ✅ Complete |
| **Automated Tests** | `backend/tests/` (34/34 passing) | ✅ Complete |
| **Manual Test Plan** | `docs/manual_test_plan.md` | ✅ Complete |
| **Demo Video Guide** | `docs/demo_video_guide.md` | ✅ Complete |
| **Submission Checklist** | `docs/submission_checklist.md` | ✅ Complete |
