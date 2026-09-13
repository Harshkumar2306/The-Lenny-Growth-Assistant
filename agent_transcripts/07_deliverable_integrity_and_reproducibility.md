# Agent Transcript 07: Deliverable Integrity & Reproducibility

**Phase:** Phase 1 — Deliverable integrity & reproducibility (workspace state vs. documented state)
**Date:** 2026-09-13
**Status:** Completed — 27/27 hermetic tests, ingest 139/5,993 verified, frontend build clean, Docker build path repaired

---

## 1. Objective

The submission claimed (transcript 06) a complete, hygienic, reproducible deliverable.
This phase re-verified every claim against the actual persisted workspace, fixed the
discrepancies, and re-ran the full verification suite — this time with the knowledge
base present, in a clean environment (no pre-built index, no live Ollama).

## 2. Findings & Fixes

### 2.1 CRITICAL — Docker image would ship with an empty index

- **Bug:** the root `.dockerignore` contained the unscoped pattern `*.md`. The backend
  image builds with `context: .` (compose) and runs `ingest.py 150` at build time from
  `data/transcripts_raw/episodes/*/transcript.md`. The pattern silently excluded **all
  303 transcripts** from the build context; `ingest.py` prints "Directory does not
  exist" and exits 0, so the image built "successfully" with 0 chunks and every
  grounded question would be rejected. (Transcript 06's docker fix was defeated by its
  own hygiene pass.)
- **Fix:** `*.md` → `/*.md` (root-level docs only), with an explanatory comment.
- **Verification:** dockerignore pattern simulation (gitwildmatch via `pathspec`):
  **303/303** transcripts now included in the build context; root docs, `docs/`,
  `agent_transcripts/`, DB files, generated indexes, and env files remain excluded.

### 2.2 MAJOR — Broken favicon

- **Bug:** `index.html` references `/logo.svg?v=2`, but `frontend/public/` contained
  only a placeholder `logo.md` (a markdown pointer to a CDN SVG).
- **Fix:** fetched the generated SVG and committed it as `frontend/public/logo.svg`;
  removed the placeholder. Vite build copies it to `dist/logo.svg` and the built
  `dist/index.html` references it correctly.

### 2.3 MAJOR — Stale committed artifacts (hygiene claims not persisted)

- **Found:** 8 gitignored-but-committed files in the workspace: the runtime fallback
  DB (`data/lenny_fallback.db`, `-shm`, `-wal`), the generated metadata sidecar
  (`data/transcripts_index.json`), and a stale production build
  (`frontend/dist/**`, including a stray `dist/logo.md`).
- **Fix:** all 8 removed from the workspace. `.gitignore` gained `data/*.db-*`
  (previously the `-shm`/`-wal` files matched no pattern); regenerated copies now
  stay out of the workspace. A full sweep confirmed **no other** tracked file matches
  `.gitignore`.

### 2.4 MAJOR — Test suite was not hermetic

- **Bug:** `test_health_endpoint` asserted `status == "healthy"`, which requires ≥1
  available model. It passed in CI only because the environment leaked an ambient
  `ANTHROPIC_API_KEY`; on a machine with no Ollama and no cloud keys it fails. The
  "27/27 on a fresh clone" claim did not hold.
- **Fix:** the test now stubs `llm_gateway.get_available_models` with one available
  model (monkeypatch), so it deterministically verifies the healthy-combination
  semantics (DB + index + ≥1 model) instead of depending on ambient credentials. The
  degraded path remains covered by `test_health_reports_degraded_when_ollama_down`.

## 3. Re-test Results (clean environment)

- `pytest backend/tests/` — **27/27 passing**, hermetic (no repo index at start: mini
  25-episode index built from transcripts; no live model runtime; ambient credentials
  irrelevant).
- `ingest.py 150` on the real corpus — **139 episodes / 5,993 chunks**, exactly as
  documented (11 archive duplicate dirs deduplicated by `video_id`); index builds in
  ~15s.
- Frontend — `tsc --noEmit` clean; `vite build` clean (1,827 modules); built app
  serves `logo.svg`.
- `run.sh` preconditions verified: `.env.example` exists (1,299 bytes), ingest gating
  on `data/search_index.pkl` works, `pytest.ini` asyncio mode confirmed.

## 4. Deferred to Phase 2 (verified findings, not yet fixed — awaiting approval)

1. **Custom provider flow broken:** `/api/models/add` accepts `provider: "custom"`
   (OpenAI-compatible) and sets it active, but `/api/models/active` rejects `custom`
   with 400 → the Add-Model modal's switch fails silently and UI state desyncs.
2. `GET /api/sessions/{id}` always returns `message_count=0`; health modal never
   displays `index_loaded`.
3. README troubleshooting claims the UI "falls back to the first available" Ollama
   model — not implemented (dropdown lists it; streaming never auto-switches).
4. `_parse_artifacts` still drops `type`/`title` for the mixed-brace malformed tag
   case documented in transcript 05.
5. Live end-to-end run of `docs/manual_test_plan.md` scenarios (browser + API) and the
   Docker Compose path still to be exercised (no Docker daemon in this environment).

## 5. Remaining Known Trade-offs (unchanged)

- TF-IDF + BM25 retrieval is intentionally embedding-free; paraphrase-heavy recall is
  bounded by lexical overlap.
- Artifact interactivity relies on inline event handlers inside the sandbox (required
  for calculators); safety comes from DOMPurify + iframe sandbox + CSP layering.
- API keys entered via the UI live only in backend process memory; a restart requires
  re-entering or `.env`.
