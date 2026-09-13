# The Lenny Growth Assistant
### Production AI Copilot Grounded in Lenny's Podcast Transcripts with Claude-Style Artifacts

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black?style=flat&logo=ollama&logoColor=white)](https://ollama.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-34%20Passed-brightgreen)](https://pytest.org)

**The Lenny Growth Assistant** is an enterprise-grade AI copilot designed for product managers, growth leads, and founders. Built for the **Forward Deployed Engineer (FDE)** take-home assessment, it transforms **300+ transcripts** from *Lenny's Podcast* into an authoritative strategic advisor that cites verified episodes, generates ~1,250-word *Ship 30 for 30* essays, and renders interactive Markdown and HTML/CSS artifacts side-by-side in the browser.

---

## 🌟 Key Capabilities

1. **Grounded Strategic Advice:**
   - Evaluated across **~6,000 semantic dialogue chunks** from 139 unique top episodes (Shreyas Doshi, Elena Verna, Casey Winters, Brian Chesky, Rahul Vohra, etc.).
   - Exact citation badges with episode title, guest name, and timestamped YouTube links (`&t=1490s`).
   - **Negative Boundary Rejection:** a semantic gate + lexical coverage gate detect out-of-domain queries and politely reject them instead of hallucinating.
2. **Dedicated "Ship 30 for 30" Skill (~1,250 words):**
   - Encodes Nicolas Cole & Dickie Bush's writing methodology: Rule of One, 1-3-1 cadence, bold lead-ins, 3–5 tactical pillars, and a 24-hour action checklist.
3. **Claude-Style In-App Artifact Viewer:**
   - Split-screen workspace rendering rich Markdown and interactive HTML/CSS prototypes beside the chat.
   - **Defense-in-Depth Security:** DOMPurify sanitization (inline `<script>` stripped, external CDN scripts allow-listed) + sandboxed `<iframe sandbox="allow-scripts">` strictly without `allow-same-origin` + Content-Security-Policy. The "Open in New Tab" action embeds the artifact in a *new* sandboxed iframe instead of trusting it in a privileged context.
4. **Flexible Multi-Model Gateway (Local + Cloud):**
   - **Local LLM (Mandatory for Demo):** Ollama running `llama3.2:1b` locally.
   - **Cloud LLM:** Groq (`llama-3.3-70b-versatile`), Anthropic, or OpenAI — add keys in the UI without editing code.
   - 1-Click model switcher in the UI header with live health diagnostics and clear, structured errors when a provider is unreachable.
5. **Resilient Persistence Engine:**
   - Multi-session history, message turns, citations JSON, and artifacts stored via async SQLAlchemy.
   - **Zero-Friction Fallback:** Primary PostgreSQL with automatic degradation to local SQLite if PostgreSQL is offline. The assistant turn is persisted *before* the stream acknowledges completion, so refreshes never lose the last message.

---

## 🏗️ Architecture Overview

```
Oogway/
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
│   └── Dockerfile           # Builds the search index at image build time
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Model selector, System Health modal
│   │   │   ├── Sidebar.tsx          # Session manager, search, curated prompt chips
│   │   │   ├── Chat/                # MessageItem, ChatPane, ChatInput
│   │   │   └── ArtifactViewer/      # Split-screen ArtifactPanel, MarkdownView, SandboxIframe
│   │   ├── lib/api.ts               # Typed API client & SSE stream processor
│   │   ├── lib/curatedPrompts.ts    # Single source of truth for the 4 curated starter prompts
│   │   ├── App.tsx                  # State coordinator
│   │   └── index.css                # Tailwind typography & micro-animations
│   ├── package.json
│   ├── vite.config.ts               # Configurable /api proxy target (compose-safe)
│   └── tailwind.config.js
├── data/
│   ├── transcripts_raw/     # 303 curated episode transcripts (YAML frontmatter + timestamps)
│   ├── search_index.pkl     # Generated at setup: BM25 + TF-IDF index (~53 MB, not committed)
│   └── transcripts_index.json  # Generated at setup: episode metadata (not committed)
├── docs/
│   ├── manual_test_plan.md      # 10 UI manual test scenarios
│   ├── demo_video_guide.md      # 2–3 minute video recording script
│   ├── QA_REPORT.md             # Final quality report (metrics + evidence)
│   └── submission_checklist.md  # Pre-submission checklist
├── agent_transcripts/       # 10 detailed agent engineering logs & retrospectives
├── docker-compose.yml       # Containerized multi-container setup
├── run.sh                   # 1-command startup script
├── .env.example             # Environment template (copy to .env; never commit .env)
└── README.md                # Evaluator documentation
```

---

## ⚡ Quickstart: Run in 1 Command

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- **Ollama** (for local demo): `brew install ollama && ollama pull llama3.2:1b`

### Option 1: Native Run (Recommended for Instant Evaluation)
Run the automated bootstrap script:
```bash
./run.sh
```
This script automatically:
1. Creates `.env` from `.env.example` (safe defaults; no secrets are committed).
2. Configures the Python virtual environment and installs dependencies.
3. Builds the search index from the transcripts (first run only, ~15 seconds).
4. Checks Ollama and model `llama3.2:1b` (starts `ollama serve` and pulls the model if needed).
5. Installs frontend dependencies and starts FastAPI (`:8000`) + Vite (`:5173`).
6. Opens the browser and shuts everything down cleanly on `Ctrl+C`.

### Option 2: Docker Compose (Production Setup)
```bash
docker compose up --build
```
Spins up PostgreSQL 16 (with `pgvector`), FastAPI backend, and Vite frontend.
The backend image builds the search index during `docker build`, and the
frontend proxies `/api` to the `backend` container (not `localhost`), so the
whole stack works inside Docker with no manual steps.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` (`./run.sh` does this for you):
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_assistant` | Async database URL. Falls back to SQLite automatically if PostgreSQL is unreachable. |
| `SQLITE_FALLBACK_URL` | `sqlite+aiosqlite:///data/lenny_fallback.db` | *(Optional)* Override the fallback database location. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama endpoint. |
| `DEFAULT_LOCAL_MODEL` | `llama3.2:1b` | Local quantized demo model. |
| `GROQ_API_KEY` | *(Optional)* | Groq API key for high-speed cloud answers. |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq-compatible API endpoint. |
| `DEFAULT_GROQ_MODEL` | `llama-3.3-70b-versatile` | Cloud model name. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | *(Optional)* | Optional cloud providers. |
| `ACTIVE_PROVIDER` | `ollama` | Provider on startup (`ollama` / `groq` / `anthropic` / `openai`). |
| `ACTIVE_MODEL` | `llama3.2:1b` | Model active on startup (mirrors `ACTIVE_PROVIDER`). |
| `DEBUG` | `false` | Toggles debug mode. |
| `CORS_ORIGINS` | localhost 5173/3000/8000 | Explicit allow-list (JSON array). Credentials are enabled, so a wildcard is intentionally not used. |
| `SEARCH_INDEX_PATH` | `data/search_index.pkl` | *(Internal)* Generated-index location; override only for advanced setups. `ingest.py` also honours `LENNY_SEARCH_PKL` / `LENNY_INDEX_JSON`. |

**Model toggle & fallback behaviour:** the active provider is shown in the UI
header and can be switched at runtime (no restart). If a provider is missing a
key, unreachable, or times out, the backend returns a **structured error event**
with actionable guidance (e.g. "start `ollama serve`") instead of hanging or
silently corrupting the chat stream.

---

## 🧪 Running Automated Tests

```bash
PYTHONPATH=backend .venv/bin/pytest backend/tests/ -v
```

The suite is **hermetic**: it runs against a throwaway SQLite database and, when
no search index is present, builds a small 25-episode index into a temp
directory. 34 tests cover:

- **API contracts** — health, sessions CRUD, model toggle, Pydantic 422s, `stream=false` JSON responses.
- **Resilience** — graceful failure when a provider key is missing, honest `degraded` health when Ollama is down, session `updated_at` ordering.
- **RAG grounding** — index loading, Shreyas Doshi / Elena Verna retrieval accuracy, citation completeness, out-of-domain rejection, duplicate-episode dedup.
- **Persistence** — FK hierarchy across sessions → messages → artifacts.
- **Ship 30 skill** — prompt structure, framework principles, artifact parsing (including malformed single-line output), and unique artifact IDs (primary-key safety).
- **Routing** — greeting/meta detection, and explicit skill selection vs. text heuristics.
- **Ship 30 conversion regression** — the "Turn into Ship 30" button pastes the full grounded answer; the retrieval gate must still ground it (long-message coverage-gate fix).

---

## 🎯 Verification Walkthrough for Evaluators

1. **Verify Local Ollama Execution:**
   - Ensure Ollama is running (`ollama serve` or the Ollama app).
   - The header shows `ollama (llama3.2:1b)` with a green dot.
   - Ask: *"What does Shreyas Doshi say about pre-mortems?"*
   - Observe retrieval from ~6,000 chunks and grounded advice citing Tigers, Paper Tigers, and Elephants.
   - Expand **"Verified Podcast Sources"** to view timestamped YouTube links.
2. **Verify Negative Boundary Rejection:**
   - Ask: *"What is the best recipe for chocolate cake?"*
   - Observe a polite rejection with no citations — **this path needs no LLM at all**, so it works even with Ollama stopped.
3. **Verify Ship 30 for 30 Skill:**
   - Click **"Turn into Ship 30 for 30 Essay (~1,250 words)"** below any assistant response.
   - The assistant generates a ~1,250-word essay following the 1-3-1 cadence and bold lead-in principles.
   - The **Side-by-Side Artifact Viewer** opens with Preview, Source, Copy, and Download buttons.
4. **Verify Interactive HTML Sandboxing:**
   - Switch mode to **"Interactive HTML Artifact"** and send: *"Create an interactive PMF calculator widget."*
   - The viewer renders it in a sandboxed `<iframe sandbox="allow-scripts">` (no `allow-same-origin`) with an injected CSP. Inline scripts are stripped by DOMPurify; only CDN scripts are allowed; "Open in New Tab" keeps the sandbox.
5. **Verify Runtime Model Switcher:**
   - Open the header model dropdown and switch to **Groq**.
   - Send a prompt and observe cloud streaming. Switch back to **Ollama** with zero reload.
6. **Verify Graceful Failure Modes:**
   - Stop Ollama and send a grounded question: the UI shows a clear, actionable error (no hang).
   - Stop PostgreSQL before startup: the app boots on SQLite and the health modal shows the fallback with an amber note.

---

## 📹 Demo Video

A step-by-step recording guide and minute-by-minute script are provided in [`docs/demo_video_guide.md`](docs/demo_video_guide.md).

## 📋 Assignment Brief Compliance Map

How each section of the Oogway Labs brief maps to this build:

| Brief | Requirement | Implemented & verified in |
|---|---|---|
| 3.1 | FastAPI backend | `backend/app` (FastAPI 0.110+) — live-verified |
| 3.1 | Agent layer (Claude Agent SDK / Pi suggested) | Purpose-built agent service (`services/agent.py`) with explicit skill boundaries & routing; Anthropic SDK as the Anthropic provider adapter. Deviation documented with rationale in PRD §1.3 and architecture §1.1 |
| 3.1 | Sessions & persistence | async SQLAlchemy — sessions/messages/artifacts with timestamps & `user_metadata`; Postgres + automatic SQLite fallback |
| 3.1 | API quality | Pydantic request/response contracts, 422 validation, structured errors, honest `/api/health` |
| 3.2 | Cloud LLM | Groq / Anthropic / OpenAI + custom OpenAI-compatible provider |
| 3.2 | Local Ollama (mandatory demo) | `llama3.2:1b` default; `run.sh` starts/pulls it; auto-fallback to the first installed model |
| 3.2 | Provider toggle + fallback docs | Header model switcher; README env table + troubleshooting |
| 3.3 | Ingestion / refresh / traceability | `ingest.py` (parse → chunk → hybrid index); **refresh:** re-run `PYTHONPATH=backend python backend/scripts/ingest.py 150`; every citation traces to episode + timestamp + YouTube link |
| 4.1 | Grounded assistant | Hybrid BM25+TF-IDF retrieval with semantic + coverage gates; follow-ups, session context, negative-boundary rejection (no LLM call) |
| 4.2 | Ship 30 skill | `ship30_skill.py` encodes the methodology (~1,250 words, hook, 1-3-1, pillars, takeaway) |
| 4.3 | Artifacts + viewer + security | ArtifactPanel (Markdown + HTML) beside the chat; DOMPurify + sandboxed iframe + CSP, documented and proven live |
| 5 | One-command startup | `./run.sh`; `docker compose up --build` (statically validated; one real run pending on a Docker-enabled machine) |
| 5 | Configuration | `.env.example` with safe defaults; no committed secrets |
| 5 | Observability & resilience | Structured JSON logs; health modal; timeouts (Ollama 180 s / cloud 90 s / health 2.5 s); missing keys, Ollama down, empty retrieval, DB failure → SQLite |
| 5 | Handoff | README troubleshooting, manual test plan, QA report, submission checklist |
| 6 | Deliverables 1–8 | all present except the public GitHub repo + recorded video, which are done by the candidate (checklist item 3) |

---

## 📄 Documentation Deliverables Index

- 📋 [**PRD.md**](PRD.md): Product Requirements Document, discovery brief, JTBD, metrics, scope, and risk matrix.
- 🗺️ [**ROADMAP.md**](ROADMAP.md): Phase-by-phase plan and progress log (completed vs. remaining work).
- 📐 [**architecture.md**](architecture.md): Database schema (ERD), API endpoints, RAG pipeline, agent routing, and security.
- 🎨 [**design.md**](design.md): UI/UX design system, layout, interaction states, responsive behavior, accessibility.
- 📝 [**agent_transcripts/**](agent_transcripts/): 10 development logs documenting technical decisions, failed attempts, and fixes.
- 🧪 [**docs/manual_test_plan.md**](docs/manual_test_plan.md): 10 manual testing scenarios with step-by-step expected results.
- 🎬 [**docs/demo_video_guide.md**](docs/demo_video_guide.md): 2–3 minute video script and submission checklist.
- ✅ [**docs/QA_REPORT.md**](docs/QA_REPORT.md): final quality report — metrics, test/build summary, live verification evidence.
- 📋 [**docs/submission_checklist.md**](docs/submission_checklist.md): pre-submission checklist and evidence index.

---

## 🤝 Forward Deployment Handoff & Troubleshooting

- **Ollama Connection Refused:** Ensure `ollama serve` is running. Health shows an amber dot and `degraded` status; sending a grounded question returns an actionable error suggesting remediation. The UI model menu lists the exact unreachable endpoint.
- **Model not installed:** Run `ollama pull llama3.2:1b`. Health reports the installed models, and the backend automatically falls back to the first installed local model when the requested one is missing (with a structured log warning), so streams never fail mid-turn because of a missing model.
- **PostgreSQL offline:** The backend logs a structured warning and switches to SQLite (`data/lenny_fallback.db`) with zero downtime; the health modal displays the fallback.
- **Port Conflicts:** `./run.sh` only reclaims ports owned by stale *app* processes (python/node), never unrelated processes.
- **Docker frontend can't reach the API:** the Vite proxy target is `API_PROXY_TARGET` (set to `http://backend:8000` inside compose). For native runs it defaults to `http://localhost:8000`.
- **Logs:** All transactions and fallback warnings are formatted as structured JSON via `backend/app/core/logging.py` (`uvicorn` stdout). Exception *details* stay in the logs; clients only receive safe messages.
