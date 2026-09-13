# Agent Transcript 09: Targeted Quality Improvements

**Phase:** Phase 3 — Targeted Quality Improvements (scoped subset)
**Date:** 2026-09-13
**Status:** Completed — 33/33 tests, clean `tsc` + `vite build`, empty-state cards + 75% resize cap verified live

---

## 1. Objective

Ship small, high-value polish items that remove real doc-vs-code drift and dead
code — without overengineering. The user authorised Phase 3 without picking a
subset, so this phase implemented the clearly-safe, in-scope "Small" items and
deliberately excluded the two that need a product/security decision.

## 2. Scope decision (recorded for transparency)

**Included (Small, in-scope):**
- 3.2 pause-aware auto-scroll
- 3.3 empty-state starter cards
- 3.4 artifact pane resize cap → 75% viewport (was 640px)
- 3.5 dead-code cleanup

**Excluded (flagged, not silently skipped):**
- **3.1 embedding-assisted retrieval** — the PRD/architecture explicitly state
  retrieval is "embedding-free, zero paid APIs, offline capable". Adding
  embeddings would reverse a documented design decision, so it needs an
  explicit product decision first.
- **3.6 secret persistence** — persisting API keys is a security-posture change
  (storage/encryption/rotation); it needs the user's explicit call.

## 3. Changes

### 3.2 Pause-aware auto-scroll (`ChatPane.tsx`)
- Before: auto-scroll fired on every token/message change unconditionally,
  yanking the user down while they tried to read earlier content.
- After: a scroll handler tracks whether the user is within ~80px of the bottom;
  auto-scroll only follows the stream while pinned. Sending a new message snaps
  to the bottom; scrolling up pauses; scrolling back down re-pins.

### 3.3 Empty-state starter cards (`ChatPane.tsx`, `Sidebar.tsx`, `lib/curatedPrompts.ts`)
- Extracted the four curated prompts into `frontend/src/lib/curatedPrompts.ts`
  (single source of truth).
- Empty chat state now renders the heading + subtitle + a 2×2 grid of clickable
  starter cards wired to `onSelectPromptChip`; the sidebar "Quick Starters"
  accordion imports the same list.
- Docs reverted to describe the empty-state cards (`design.md` §3.1,
  `manual_test_plan.md` UI-01) — now accurate again.

### 3.4 Artifact pane resize cap (`ArtifactPanel.tsx`)
- Before: drag-resize capped the panel at a hard 640px (design.md says "up to
  75% of screen width").
- After: `MAX_PANEL_WIDTH=640` → `MAX_PANEL_FRACTION=0.75`; drag extent is
  `min(75% viewport, viewport − 500px chat-min)`; CSS `maxWidth: '75%'`;
  tooltips updated.
- Live check: computed panel style is `minWidth: 360px; maxWidth: 75%`.

### 3.5 Dead-code cleanup
- Removed `MessageResponse` schema (`chat_schemas.py`) — unused.
- Removed unused imports from `api/sessions.py` (`MessageResponse`, `ArtifactItem`, `CitationItem`).
- Removed unused `configureModelKey()` from `frontend/src/lib/api.ts`.
- Removed unread `TRANSCRIPTS_INDEX_PATH` setting (`core/config.py`) + its
  references in `conftest.py` and the README env table (kept `SEARCH_INDEX_PATH`,
  which the RAG engine actually reads).
- Removed unused `python-multipart` from `backend/requirements.txt`.

## 4. Verification

- `pytest backend/tests/` — **33/33 passing** (hermetic).
- `tsc --noEmit` + `vite build` — clean.
- Browser spot-check (Playwright): empty state renders the 4 starter cards
  (screenshot); clicking "PMF Score Calculator" flowed through to a generated,
  sandboxed HTML artifact; panel computed `maxWidth: 75%` / `minWidth: 360px`.

Evidence: https://static.moxtcontent.com/public/resource/ai/gen/dac693bb-eb9d-499c-aa0c-748a673b6ad0.png

## 5. Remaining work

- **Phase 4 — Final Packaging & Submission**: demo video guide validation,
  final QA report, docs consistency sweep, submission checklist.
- If desired later: 3.1 (embeddings) and 3.6 (secret persistence) as separate
  opt-in decisions.
