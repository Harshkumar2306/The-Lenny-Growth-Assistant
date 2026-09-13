# Agent Transcript 06: Independent Senior-Engineer Review & Hardening Pass

**Phase:** Independent review, re-test, and hardening (evaluate → fix → improve cycle)
**Date:** 2026-09-13
**Status:** Completed — 27/27 tests passing, frontend production build clean

---

## 1. Objective

Treat the existing submission as if it arrived from another team: question every
assumption, run the code, attack the failure modes, and fix what breaks. This
log records the issues found, the failed attempts at fixes, and the corrections.

## 2. Verification First (what was actually true)

- Ran `backend/scripts/ingest.py 150`: **6,445 chunks** from 150 directories
  matched the docs — until the dedup pass revealed **11 archive directories
  with duplicate video IDs** (e.g. `andy-raskin_`, `hamelshreya`). With
  video-ID dedup the corpus is **139 unique episodes / 5,993 chunks**; docs
  now state ~6,000 chunks honestly.
- Ran the original test suite: 18/18 passed — but only because a pre-built
  53 MB index existed in the working copy. ❌ **A fresh clone fails the suite.**
- Frontend `tsc` passed, but the build used ~33 undefined Tailwind utilities
  (`bg-stone-850`, `shadow-xs`, `animate-in`, `h-13`, …) that render as no-ops.
- `frontend/public/` did not exist although `index.html` references `/logo.svg`
  → broken favicon.

## 3. Failures Found & Fixes

### 3.1 Security — artifact viewer (Critical)

- **Bug:** `DOMPurify.sanitize` was called with `ADD_TAGS: ['script', …]` and
  `ADD_ATTR: ['onclick', 'oninput', 'onchange']` — the sanitizer was explicitly
  told to keep `<script>` tags and inline event handlers. The "Open in New Tab"
  button then opened the sanitized HTML as a **blob URL in a new tab, which
  inherits the app's origin** — no sandbox, no CSP isolation. A malicious
  LLM-generated artifact could read the app's `localStorage` and make
  credentialed same-origin requests (full XSS against the app origin).
- **Fix:** the sanitizer now strips every `<script>` except external
  `https://` CDN scripts (via a `uponSanitizeElement` hook), and "Open in New
  Tab" opens a **wrapper page containing zero LLM content** which embeds the
  artifact inside a fresh `<iframe sandbox="allow-scripts">`. The iframe keeps
  `referrerPolicy="no-referrer"`; the injected CSP adds `object-src 'none'`,
  `base-uri 'none'`, `form-action 'none'`.

### 3.2 Correctness — persist-before-done race

- **Bug:** the assistant message was committed to the database *after* the SSE
  `done` event was emitted. A client that refreshes on `done` could miss the
  final assistant turn.
- **Fix:** persistence now happens before `done` is yielded; `done` carries a
  `persisted` flag. Added test `test_session_updated_at_bumps_on_activity`.

### 3.3 Correctness — duplicate artifact IDs

- **Bug:** artifact IDs came from the model output, and the Ship 30 prompt
  hard-codes `id="essay"`. Two essays → primary-key collision → the whole
  persist transaction fails silently → the assistant message is lost.
- **Fix:** the server regenerates a UUID for every parsed artifact; model IDs
  are ignored. Test: `test_artifact_parsing_generates_unique_ids`.

### 3.4 Correctness — DB engine mislabelling

- **Bug:** `init_db_engine()` unconditionally treated `DATABASE_URL` as
  PostgreSQL — a SQLite URL (e.g. from tests) connected fine but was reported
  as `postgresql` in health, and SQLite pragmas (WAL, busy timeout) were never
  applied.
- **Fix:** branch on the URL scheme; apply WAL + busy timeout + FK pragmas for
  SQLite; dispose the failed PG engine.

### 3.5 Retrieval — out-of-domain false positives

- **Bug:** "What is the best recipe for chocolate cake?" scored **0.28** on the
  25-episode mini index (incidental hits on "cake" in a Lyft launch anecdote)
  and **0.33** on the full corpus — above the 0.12 rejection threshold.
- **Fix (3 iterations):**
  1. Lexical coverage factor on candidates — helped, but thresholds were
     corpus-dependent.
  2. Content-token selection by median IDF + a top-3 union coverage rule — the
     median of a 25k-vocabulary (words + bigrams) is dominated by rare
     bigrams, so "growth" counted as content, and the union rule let coverage
     spread across unrelated chunks ("recipe" in one, "cake" in another).
  3. **Final:** content tokens = IDF ≥ 5.0; two-phase ranking (coverage factor
     applied to a 200-candidate window, everything else zeroed so ungated
     low-rank chunks can't outrank gated ones); rejection when the SINGLE best
     chunk fails coverage (≥3 tokens: < 0.5; 2 tokens: < 1.0).
- **Verified:** chocolate cake 0.00 ✅, world cup 0.00 ✅, dog-fetch 0.00 ✅;
  Shreyas 0.76, Elena 0.67, PMF 0.76, Casey Winters 0.80, pricing 0.20,
  retention 0.18 all pass. Known residual edge case: "weather in tokyo"
  (0.27) — the Eric Ries episode genuinely discusses a SF→Tokyo flight
  company and "weathering" storms; documented as a lexical-retrieval limit.

### 3.6 Routing — explicit skill selection

- **Bug:** `skill="artifact"` was ignored; HTML mode was triggered by substring
  `"html" in message`, and `"ship 30" in message` misfired on phrases like
  "shipping 30 features".
- **Fix:** `_detect_intent()` — explicit UI skill wins; word-boundary regex
  fallback in chat mode only. Tests in `test_intent_routing_explicit_skill_wins`.

### 3.7 Resilience — provider failures

- **Bug:** gateway errors were streamed as inline text inside the chat, and a
  missing key could only be discovered mid-stream.
- **Fix:** `LLMProviderError` typed exceptions; a preflight check runs after
  grounding (greetings and out-of-domain rejections need no LLM at all);
  failures emit a structured `error` SSE event with actionable guidance.

### 3.8 Honest health semantics

- **Bug:** `/api/health` always reported `status: "healthy"`.
- **Fix:** `healthy` only when DB connected AND index loaded AND ≥1 model
  available; otherwise `degraded`. Health JSON includes `index_loaded`. The
  health modal in the UI surfaces the SQLite-fallback note.

### 3.9 Docker path was broken

- **Bug 1:** the backend image never ran ingest → shipped with 0 chunks → every
  question rejected. **Fix:** ingest runs at image build time.
- **Bug 2:** the frontend container's Vite proxy targeted `localhost:8000`,
  which resolves to *the frontend container itself* inside compose. **Fix:**
  `API_PROXY_TARGET` env var, set to `http://backend:8000` in compose.
- **Bug 3:** no `.dockerignore` → `node_modules`, `.git`, stale DBs in build
  contexts. **Fix:** root + frontend `.dockerignore`.

### 3.10 Test hermeticity

- **Bug:** tests depended on the 53 MB committed index and wrote to the real
  fallback DB, mutating global settings.
- **Fix:** `conftest.py` points `DATABASE_URL` at a temp SQLite file, builds a
  25-episode mini index into a temp dir when the repo index is missing, and
  snapshots/restores all mutable settings between tests.

### 3.11 Contracts & API quality

- Added a real `stream=false` JSON contract (same turn data, single object).
- CORS: removed the `"*"` origin (invalid with credentialed requests); explicit
  allow-list.
- Global exception handler no longer leaks `str(exc)` to clients; details go to
  structured logs only.
- Sessions now bump `updated_at` on activity (sidebar recency ordering).
- `/api/models/active` and `/configure` validate payloads; `/add` rejects
  invalid base URLs and short keys.

### 3.12 Repository hygiene

- Removed byte-identical doc duplicates (`docs/PRD.md` etc.), the upstream
  `data/transcripts_raw/CLAUDE.md`, the stale committed `frontend/dist`, the
  generated index artifacts, and the committed `.env` (only safe defaults, but
  hygiene matters) — `run.sh` now creates `.env` from `.env.example`.
- `.gitignore` now covers generated indexes; ingest de-duplicates episodes by
  `video_id` and writes a compact metadata-only JSON sidecar.

## 4. Re-test Results

- `pytest backend/tests/` — **27/27 passing**, hermetic (no repo index, temp DB).
- `tsc --noEmit` + `vite build` — clean (1,827 modules).
- Live smoke test (uvicorn + SQLite fallback): health (honest `degraded`
  without index/Ollama), sessions CRUD, greeting via SSE and JSON, out-of-domain
  rejection with **no LLM call**, persistence confirmed via session listing.

## 5. Remaining Known Trade-offs

- TF-IDF + BM25 is intentionally embedding-free (zero paid APIs, offline
  capable); semantic recall for paraphrase-heavy queries is bounded by lexical
  overlap — documented in `architecture.md`.
- Artifact interactivity relies on inline event handlers inside the sandbox;
  removing them would break calculators. The sandbox + CSP layering is what
  makes that safe, and the new-tab path preserves the sandbox.
- API keys entered via the UI live only in the backend process memory (no
  secret persistence); restart requires re-entering or `.env`.
