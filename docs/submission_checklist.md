# Submission Checklist — The Lenny Growth Assistant

**Phase 4 — Final Packaging & Submission** · **Date:** 2026-09-13 (brief re-audited 14:xx)

**Deadline: 15/09/26 EOD** · Submission form: https://forms.gle/LgotDHNVxW1mbzNE7

Use this list right before submitting. Everything marked ✅ was verified during
Phase 4; items marked ⚠️ need an evaluator-accessible machine (Docker/Ollama).

## 1. Repository State

- [x] `pytest backend/tests/` — **34/34 passing, hermetic** (fresh-clone path: 32 + 2 skipped by design).
- [x] `tsc --noEmit` + `vite build` — clean.
- [x] No committed secrets: `.env` absent, `.env.example` present, API keys empty in template.
- [x] No generated artifacts committed: `data/search_index.pkl`, `data/transcripts_index.json`, `*.db` removed (rebuilt by `run.sh`).
- [x] Real `frontend/public/logo.svg` committed (favicon resolves).
- [x] 303 curated transcripts present under `data/transcripts_raw/` (26 MB).
- [x] `ingest.py 150` re-verified: **139 unique episodes / 5,993 chunks**.
- [x] Docs consistent with code (README ↔ PRD ↔ architecture ↔ design ↔ manual plan ↔ demo guide ↔ QA report).
- [x] Zero pending workspace changes (submission snapshot clean).

## 2. Acceptance Criteria (PRD)

- [x] AC-1 Fast response — TTFT/citations measured at 20–50 ms pipeline latency (mock cloud velocity); real-provider confirmation ⚠️ on your machine.
- [x] AC-2 Citation attribution — guest, episode title, timestamp, quote, YouTube link on every grounded turn (live).
- [x] AC-3 Negative rejection — verified live, zero LLM calls (~28 ms).
- [x] AC-4 Multi-session persistence — sessions/messages/artifacts in SQLite fallback (live) with Postgres as primary.
- [x] AC-5 Runtime model toggle — custom provider + switch verified via API and UI.
- [x] AC-6 Artifact viewer — Preview/Source/Copy/Download/Fullscreen; HTML sandboxing verified (opaque origin + CSP).
- [x] AC-7 1-command startup — `./run.sh` (steps re-verified); `docker compose up --build` ⚠️ static-only (see below).
- [x] AC-8 34/34 hermetic tests.
- [x] AC-9 `stream=false` returns the same turn as one JSON object.
- [x] AC-10 Honest health — `healthy`/`degraded` semantics verified.

## 3. Before You Submit (on your machine)

- [ ] **Public GitHub repository** (deliverable #1): push this repo to a public GitHub repo; verify no secrets and no generated indexes in the commit (`.gitignore` already covers `.env`, `*.db`, `data/search_index.pkl`, `node_modules/`, `dist/`).
- [ ] One real `docker compose up --build` run (Postgres + backend + frontend; backend builds the index at image build time). This is the single step no phase could run in the sandbox.
- [ ] With Ollama running: ask the Shreyas pre-mortems question, confirm the local stream and green health dot (demo guide pre-flight checklist).
- [ ] Record the 2–3 minute video (camera on) following `docs/demo_video_guide.md`; upload as **Unlisted** to YouTube.
- [ ] Paste the YouTube link + GitHub repo link into the submission form (https://forms.gle/LgotDHNVxW1mbzNE7) **by 15/09/26 EOD**.

## 4. Evidence Index

| What | Where |
|---|---|
| Final quality report | `docs/QA_REPORT.md` |
| Manual test scenarios | `docs/manual_test_plan.md` (10/10 PASS) |
| Video script + pre-flight | `docs/demo_video_guide.md` |
| Phase 4 transcript | `agent_transcripts/10_final_packaging_and_submission.md` |
| Implementation Plan (all phases) | `PRD.md` (§6) |
| Live screenshots | see `docs/QA_REPORT.md` §9 |
