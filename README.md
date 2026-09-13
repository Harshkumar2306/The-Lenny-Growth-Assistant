# The Lenny Growth Assistant
### Production AI Copilot Grounded in Lenny's Podcast Transcripts with Claude-Style Artifacts

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Demo_Ready-black?style=flat&logo=ollama&logoColor=white)](https://ollama.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_|_SQLite_Fallback-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-34%20Passed%20(100%25)-brightgreen?style=flat&logo=pytest&logoColor=white)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Lenny Growth Assistant** is an enterprise-grade AI conversational system designed for product managers, growth leads, and tech founders. Built for the **Forward Deployed Engineer (FDE)** take-home assessment, it transforms **300+ transcripts** from *Lenny's Podcast* into an authoritative strategic advisor that cites verified episodes with deep YouTube timestamps, synthesizes ~1,250-word *Ship 30 for 30* essays, and live-renders interactive sandboxed HTML/CSS calculators beside the chat in an in-app **Artifact Viewer**.

👉 **GitHub Repository:** [https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant](https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant)

---

## ⚡ 1-Minute Evaluator Quickstart

Clone and run the entire stack with a single command:

```bash
git clone https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant.git
cd The-Lenny-Growth-Assistant
./run.sh
```

`./run.sh` will automatically:
1. Initialize `.env` from `.env.example` with zero-secret safe defaults.
2. Create Python `.venv` and install backend dependencies.
3. Build the hybrid vector search index from the raw transcripts (~15 seconds on initial boot).
4. Verify local **Ollama** runtime (`llama3.2:1b`), starting `ollama serve` and pulling the model if needed.
5. Install frontend dependencies and launch **FastAPI** (`:8000`) and **Vite** (`:5173`).
6. Automatically open your browser at **[http://localhost:5173](http://localhost:5173)**.

*(To shut down cleanly, simply press `Ctrl+C` in your terminal).*

---

## 🧪 3-Step Verification Tour

Once the application opens in your browser at `http://localhost:5173`, test these three distinct capabilities:

```
┌────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│                      CHAT STREAM                       │                  ARTIFACT VIEWER CANVAS                │
│                                                        │                                                        │
│  [✦ Grounded Q&A]  [📖 Ship 30 Essay]  [🗂 Interactive HTML] │  < 1/4 >   [👁 Preview]  [<> Code]  [📥 Export]  [⛶]      │
│                                                        │                                                        │
│  User: What does Shreyas Doshi teach about pre-mortems? │  ┌──────────────────────────────────────────────────┐  │
│  Assistant: Based on the podcast...                    │  │  [Sandboxed Execution]   [Fluid] [Desktop] [Mobile]│  │
│                                                        │  │                                                  │  │
│  ▼ Verified Podcast Sources (5)                        │  │  Product Market Fit Score: 68%                   │  │
│    • Shreyas Doshi - 00:28:28 (YouTube Link)           │  │  [=========██████████████████████░░░░░░░░░░]     │  │
│    • Shreyas Doshi - 00:30:07 (YouTube Link)           │  │                                                  │  │
│                                                        │  │  Interactive PMF Calculator                      │  │
│  [Turn into Ship 30 Essay (~1,250w) ➔]                 │  │  (Live Form Controls & Sliders inside iframe)    │  │
│                                                        │  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

| Step | Mode Pill | Copy-Paste Prompt | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | **`✦ Grounded Q&A`** | `"How does Shreyas Doshi recommend running a product pre-mortem, and what are Tigers, Paper Tigers, and Elephants?"` | Real-time stream with tactical advice + expandable source badges linking to exact YouTube timestamps (`00:28:28`). |
| **2** | **`🗂 Interactive HTML`** | `"Create an interactive HTML/CSS Product-Market Fit calculator using Rahul Vohra's Superhuman 40% rule"` | Splits the screen and live-renders a reactive, clickable calculator inside a secure sandbox iframe with viewport switchers. |
| **3** | **`📖 Ship 30 Essay`** | `"Write a Ship 30 for 30 essay on why retention comes before acquisition according to Casey Winters"` | Renders a structured ~1,250-word digital essay in the Artifact Viewer with reading time analytics and a 1-click **Print to PDF** button. |

---

## 🌟 Key Capabilities

### 1. High-Precision Grounded RAG with Deep-Link Citations
- **Curated Corpus:** Indexed across **5,993 semantic dialogue chunks** from 300+ Lenny's Podcast episodes.
- **Deep-Link Video Traceability:** Every factual point cites the exact episode name, guest, verbatim quote, cosine relevance match %, and deep YouTube video link (e.g. `https://youtube.com/watch?v=YP_QghPLG-8&t=1708s`).
- **Semantic Boundary Rejection:** A deterministic coverage and relevance gate detects out-of-domain queries (e.g., *"How do I bake a sourdough bread?"*) and rejects them politely in **~28ms with ZERO LLM inference cost or hallucination**.

### 2. Dedicated "Ship 30 for 30" Content Engine (~1,250 words)
- Encodes Nicolas Cole & Dickie Bush's viral digital writing principles:
  - **Magnetic Headline & Hook:** Gripping opening line establishing immediate high stakes.
  - **1-3-1 Cadence:** Alternating single-sentence impact lines with 3-sentence analytical mechanisms.
  - **Skimmable Visual Architecture:** Bold lead-ins, bulleted pillars, and actionable takeaways.
  - **In-App Analytics:** Dynamically calculates total word count, estimated reading time, and includes instant PDF export.

### 3. Claude-Style In-App Artifact Viewer
- **Split-Screen Workspace:** Renders rich documentation and interactive prototypes directly beside the chat without navigating away.
- **Defense-in-Depth Security:** 
  - DOMPurify HTML sanitization.
  - Injected sandboxed iframe: `<iframe sandbox="allow-scripts">` strictly omitting `allow-same-origin` to isolate runtime storage, cookies, and local credentials.
  - Strict Content-Security-Policy (CSP) headers.
- **Multi-Device Viewport Testing:** Test generated tools instantly in **Fluid (100%)**, **Desktop (1024px)**, **Tablet (768px)**, and **Mobile (375px)** modes.

### 4. Flexible Multi-Model Gateway (Local + Cloud)
- **Local LLM (Mandatory for Take-Home Demo):** Runs offline using Ollama with `llama3.2:1b`.
- **Cloud LLMs:** Drop in API keys for **Groq** (`llama-3.3-70b-versatile`), **Anthropic Claude** (`claude-3-5-sonnet`), **OpenAI** (`gpt-4o`), or any custom OpenAI-compatible endpoint directly via the UI modal.
- **Zero-Code Model Switcher:** Switch between local and cloud runtimes on-the-fly with live health indicators.

### 5. Resilient Dual-Layer Persistence Engine
- Multi-session chat history, message turns, citations, and versioned artifacts stored via async SQLAlchemy.
- **Automatic Fallback:** Targets primary **PostgreSQL 16** (`pgvector`), with automatic, zero-downtime degradation to an embedded **SQLite WAL** database (`data/lenny_fallback.db`) if Postgres is unreachable. Evaluators can run the project on any machine without Docker or database setup!

---

## 🏗️ Architecture Overview

```
The-Lenny-Growth-Assistant/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers: /chat, /sessions, /models, /artifacts, /health
│   │   ├── core/            # Config (.env), Database engine (Postgres/SQLite), Structured logging
│   │   ├── models/          # SQLAlchemy async models: ChatSession, ChatMessage, ChatArtifact
│   │   ├── schemas/         # Pydantic validation schemas & request/response contracts
│   │   ├── services/
│   │   │   ├── rag_engine.py    # Hybrid BM25 + TF-IDF search with semantic & coverage gates
│   │   │   ├── llm_gateway.py   # Unified adapter: Ollama, Groq, Anthropic, OpenAI
│   │   │   ├── agent.py         # Conversational agent & artifact extraction engine
│   │   │   └── ship30_skill.py  # Ship 30 for 30 content generation skill
│   │   └── main.py          # FastAPI application entrypoint
│   ├── scripts/
│   │   └── ingest.py        # Transcript parser & hybrid index builder
│   ├── tests/               # 34 automated pytest unit & integration tests (hermetic)
│   ├── requirements.txt
│   └── Dockerfile           # Builds search index at container build time
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Model selector, System Health modal
│   │   │   ├── Sidebar.tsx          # Session manager, search, curated prompt chips
│   │   │   ├── Chat/                # MessageItem, ChatPane, ChatInput
│   │   │   └── ArtifactViewer/      # Split-screen ArtifactPanel, MarkdownView, SandboxIframe
│   │   ├── lib/api.ts               # Typed API client & SSE stream processor
│   │   ├── lib/curatedPrompts.ts    # Curated starter prompts & skills mapping
│   │   ├── App.tsx                  # State coordinator
│   │   └── index.css                # Tailwind typography & micro-animations
│   ├── package.json
│   ├── vite.config.ts               # Configurable /api proxy target (compose-safe)
│   └── tailwind.config.js
├── data/
│   ├── transcripts_raw/     # 303 curated episode transcripts (YAML frontmatter + timestamps)
│   ├── search_index.pkl     # Precomputed search index (5,993 chunks, ~50 MB)
│   └── transcripts_index.json  # Metadata & episode directory
├── docs/
│   ├── manual_test_plan.md      # 10 UI manual test scenarios (Deliverable #7)
│   └── demo_video_guide.md      # 2–3 minute video recording script (Deliverable #8)
├── agent_transcripts/       # 10 detailed agent engineering logs & retrospectives
├── docker-compose.yml       # Production multi-container setup (Postgres + Backend + Frontend)
├── run.sh                   # 1-command startup script
├── PRD.md                   # Product Requirements Document (Discovery brief, JTBD, metrics, implementation plan)
├── architecture.md          # System architecture, schemas, and security topology
├── design.md                # UI/UX design specifications and interaction patterns
├── .env.example             # Environment template (copy to .env; never commit .env)
└── pytest.ini               # Pytest async configuration
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` (`./run.sh` does this automatically):
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_assistant` | Primary async database URL. Automatically degrades to SQLite fallback if Postgres is offline. |
| `SQLITE_FALLBACK_URL` | `sqlite+aiosqlite:///data/lenny_fallback.db` | Fallback SQLite database location with WAL mode enabled. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama endpoint. |
| `DEFAULT_LOCAL_MODEL` | `llama3.2:1b` | Local quantized demo model. |
| `GROQ_API_KEY` | *(Optional)* | Groq API key for instant high-speed cloud inference. |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq-compatible API endpoint. |
| `DEFAULT_GROQ_MODEL` | `llama-3.3-70b-versatile` | Default cloud model name. |
| `ANTHROPIC_API_KEY` | *(Optional)* | Anthropic API key for Claude 3.5 Sonnet. |
| `OPENAI_API_KEY` | *(Optional)* | OpenAI API key for GPT-4o. |
| `ACTIVE_PROVIDER` | `ollama` | Provider active on initial boot (`ollama`, `groq`, `anthropic`, `openai`). |
| `ACTIVE_MODEL` | `llama3.2:1b` | Model active on startup (mirrors `ACTIVE_PROVIDER`). |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]` | Explicit CORS allowlist. |

---

## 🧪 Automated Testing Suite

The test suite is hermetic, fast (<0.5s), and runs against an isolated in-memory test database:

```bash
cd "The Lenny Growth Assistant"
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests/ -v
```

### Test Coverage Highlights (34/34 Passing)
- **API Contracts (`test_api.py`):** Health status, sessions CRUD, model activation, Pydantic 422 validations, non-streaming `stream=false` JSON parity.
- **Resilience & Fallback (`test_persistence.py`):** Automatic SQLite degradation, foreign-key cascade, conversation and artifact versioning persistence.
- **RAG Grounding & Gates (`test_rag.py`):** Vector similarity, Shreyas Doshi & Elena Verna chunk retrieval, duplicate episode deduplication, semantic negative rejection.
- **Ship 30 Skill (`test_ship30.py`):** 1-3-1 prompt formatting, parsing edge-cases, artifact extraction regex, long-turn conversion regression prevention.

---

## 🐳 Alternative Deployment: Docker Compose

For a containerized multi-container setup with PostgreSQL 16:

```bash
docker compose up --build
```

This spins up:
1. `db`: PostgreSQL 16 container.
2. `backend`: FastAPI app (compiles index on build, applies migrations on start).
3. `frontend`: Nginx/Vite reverse proxy serving on `http://localhost:5173`.

---

## 📋 Assignment Brief Compliance Matrix

| Brief Section | Specification Requirement | Implemented & Verified In |
| :---: | :--- | :--- |
| **3.1** | **FastAPI Backend** | `backend/app/main.py` (FastAPI 0.110+) with structured exception handlers |
| **3.1** | **Agent Layer** | `services/agent.py` with explicit skill routing, tool boundaries, and stream parsing |
| **3.1** | **Sessions & Persistence** | PostgreSQL primary with zero-downtime SQLite WAL fallback (`services/database.py`) |
| **3.1** | **API Quality** | Typed Pydantic v2 contracts, structured error events, `/api/health` diagnostics |
| **3.2** | **Cloud LLM Support** | Groq (`llama-3.3-70b`), Anthropic (`claude-3-5-sonnet`), OpenAI (`gpt-4o`) |
| **3.2** | **Local LLM (Mandatory Demo)** | Ollama `llama3.2:1b` verified running 100% offline |
| **3.2** | **Model Switcher UI** | Header runtime dropdown with live status indicator and custom key input modal |
| **3.3** | **Knowledge Ingestion & Grounding** | 300+ Lenny's Podcast episodes chunked and indexed; citations with deep YouTube time links |
| **4.1** | **Grounded Conversational Assistant** | Hybrid search + semantic coverage gates; negative boundary rejection in ~28ms |
| **4.2** | **Ship 30 for 30 Skill** | Dedicated ~1,250-word digital essay generator with 1-3-1 cadence and PDF export |
| **4.3** | **Artifact Generation & Viewer** | Split-screen canvas with DOMPurify sanitization and iframe sandbox isolation |
| **5.0** | **One-Command Startup** | `./run.sh` automated bootstrap script + `docker-compose.yml` |
| **5.0** | **Observability & Resilience** | Structured JSON logging; graceful handling of missing keys and timeouts |
| **6.0** | **Required Deliverables (1–8)** | All 8 required deliverables verified and indexed below |

---

## 📁 Required Deliverables Index

| # | Deliverable | Location in Repository | Description |
| :---: | :--- | :--- | :--- |
| **1** | **Public GitHub Repo** | [The-Lenny-Growth-Assistant](https://github.com/Harshkumar2306/The-Lenny-Growth-Assistant) | Complete source code, clean git tree, zero committed secrets |
| **2** | **README.md** | [`README.md`](README.md) | Architecture overview, 1-command run, test guide, troubleshooting |
| **3** | **PRD** | [`PRD.md`](PRD.md) | Problem discovery, JTBD, success metrics, assumptions, risk matrix |
| **4** | **design.md** | [`design.md`](design.md) | UI/UX design system, Claude Artifacts layout, responsive states |
| **5** | **architecture.md** | [`architecture.md`](architecture.md) | DB schema (ERD), API endpoints, RAG pipeline, sandbox security |
| **6** | **Agent Transcripts** | [`agent_transcripts/`](agent_transcripts/) | 10 chronological development transcripts documenting decisions and fixes |
| **7** | **Tests** | [`backend/tests/`](backend/tests/) | 34 passing automated tests + [Manual Test Plan](docs/manual_test_plan.md) |
| **8** | **Demo Video Guide** | [`docs/demo_video_guide.md`](docs/demo_video_guide.md) | 2–3 minute video outline and presentation script |

---

## 🤝 Forward Deployment Handoff & Troubleshooting

- **Ollama Connection Refused:** Ensure Ollama is running (`ollama serve`). The UI header will display an amber status dot, and any chat request will return an actionable instruction modal rather than hanging.
- **Model Not Found Locally:** Run `ollama pull llama3.2:1b`. The backend automatically detects installed models and falls back to the first available local model if the requested one is not downloaded.
- **PostgreSQL Offline:** The backend logs a structured warning and automatically activates SQLite (`data/lenny_fallback.db`). You will see `"Running on resilient SQLite fallback"` in the System Health modal.
- **Port Conflicts:** `./run.sh` checks ports 8000 and 5173, cleanly reclaiming stale python/node processes from prior runs without terminating unrelated system processes.
- **Structured Logs:** All request cycles and warnings are formatted as structured JSON via `backend/app/core/logging.py` in the uvicorn stdout stream.

---

<div align="center">
  <sub>Built for the <strong>Oogway Labs Forward Deployed Engineer Assessment</strong>. Powered by Lenny's Podcast transcripts.</sub>
</div>
