# UI/UX Design System & Mechanics
## The Lenny Growth Assistant (Premium FDE Edition)

**Design Philosophy:** High-Agency Editorial Copilot (Claude-style resizable split screen meets Substack editorial warmth)  
**Target User:** Product Managers, Growth Directors, Startup Founders  
**Key Interaction Model:** Conversational Advisory with Native Side-by-Side Artifact Rendering & Device Simulation  

---

## 1. UI/UX Principles & Aesthetic Direction

1. **Substack Editorial Warmth:**
   Lenny Rachitsky's brand is synonymous with warm, thoughtful, high-signal editorial content. The UI adopts an amber/orange/stone palette (`amber-500` accents on deep `stone-950` backgrounds) rather than cold corporate blue, paired with Plus Jakarta Sans and JetBrains Mono.
2. **Zero Mental Overhead:**
   Users shouldn't need prompt engineering skills or infrastructure knowledge. The UI surfaces:
   - **Mode Chips:** `Grounded Q&A`, `Ship 30 Essay`, and `Interactive HTML` above the composer.
   - **Curated Prompt Gallery:** Pre-categorized starters as clickable cards on the empty state and under the collapsible "Quick Starters" accordion in the sidebar (Pre-Mortem Strategy, Ship 30 Essay, B2B Growth Loops, PMF Calculator).
3. **Claude-Style In-App Artifact Viewer with Resizable Split-Pane:**
   Rather than dumping 1,250 words of markdown or raw HTML code into the conversational stream, substantive deliverables pop open beside the chat in a dedicated, **drag-to-resize split-pane** (360px to 75% screen width, fullscreen toggle on desktop, full-screen overlay on mobile). Users can read, preview, copy, or download while continuing the dialogue on the left.
4. **Interactive Sandbox for HTML Prototypes:**
   For interactive HTML artifacts (calculators, dashboards, widgets), the viewer renders the prototype in a sandboxed iframe with a persistent "Sandboxed Execution Active" banner, a reload control, and an "Open in New Tab" action that preserves sandboxing.
5. **Editorial Reading Statistics:**
   Markdown essays automatically display dynamic word counts (e.g. `1,248 words`), estimated reading time (`~5 min read`), and a **Ship 30** badge when the word count lands in the 1,000–1,500 range.
6. **Transparent Verification:**
   Every grounded assistant message includes a **Verified Podcast Sources drawer** with guest names, episode titles, match percentages, and direct timestamp links to the YouTube episode (`&t=1490s`). Rejected (out-of-domain) answers show no sources at all.

---

## 2. Information Architecture & Layout Hierarchy

```
+-----------------------------------------------------------------------------------------------------------------------+
|  [Logo] The Lenny Growth Assistant (FDE Edition)     [Model: Ollama (llama3.2:1b) v]  [Key] [DB] [Artifact Viewer]     |
+-----------------------+-------------------------------------------------------+---------------------------------------+
|  SIDEBAR (288px)      |  CHAT WORKSPACE (Flexible)                            |  RESIZABLE ARTIFACT PANEL (Drag Edge) |
|                       |                                                       |  (360px – 75% viewport / Fullscreen)   |
|  New Session          |  [User Message Bubble]                                |                                       |
|  [Collapse <]         |                                                       |  [Title: Pre-Mortem Template]         |
|                       |  [Assistant Message Bubble]                           |  [1/2 Nav] [Preview/Source] [Copy/DL] |
|  [Search Sessions]    |  - Key insights with bold highlights                  |                                       |
|                       |  - [Verified Podcast Sources (5) v]                   |                                       |
|  Conversations (4):   |    - Shreyas Doshi (00:24:50)                         |  +---------------------------------+  |
|  * Shreyas Pre-Mortem |                                                       |  | Sandboxed Iframe /              |  |
|  * PLG Loops - Elena  |  +-------------------------------------------------+  |  | Styled Typography + Word Count  |  |
|  * Superhuman PMF     |  | [Box] Pre-Mortem Template (Markdown)           |  |  | (1,248 words • ~5 min read)     |  |
|                       |  | Click to open in side-by-side Artifact Viewer   |  |  +---------------------------------+  |
|  Quick Starters:      |  +-------------------------------------------------+  |                                       |
|  [All] [Pillars] [Ship]|                                                       |                                       |
|  * Pre-Mortems        |  [Turn into Ship 30 for 30 Essay Button]              |                                       |
|  * Ship 30 Essay      |                                                       |                                       |
|  * PMF Calculator     |                                                       |                                       |
|                       |  [Mode: Q&A | Ship 30 | Artifact]                      |                                       |
|  [Export Chat]        |  [Textarea: Ask anything grounded in Lenny's...] [Send]|                                       |
+-----------------------+-------------------------------------------------------+---------------------------------------+
```

---

## 3. Key Interaction States & Micro-Interactions

### 3.1 Empty State Hero Screen
When opening a new session, the chat view presents a welcoming hero card:
- Animated gradient badge with amber pulse.
- Heading *"How can I help you grow today?"* and the subtitle *"Ask a product or growth question, or start from a curated prompt grounded in Lenny's Podcast."*
- 4 interactive feature cards:
  1. *Pre-Mortem Strategy* — subtitle: *Shreyas Doshi on Tigers & Elephants*.
  2. *Retention vs. Acquisition* — subtitle: *Ship 30 Essay grounded in Casey Winters*.
  3. *B2B Growth Loops* — subtitle: *Elena Verna on PLG & Expansion*.
  4. *PMF Score Calculator* — subtitle: *Rahul Vohra Superhuman 40% threshold*.

### 3.2 Real-Time Streaming State
- **Thinking / Retrieval Indicator:** Real-time SSE progress badge:
  - `Searching Lenny's Podcast knowledge base... (5 podcast sources)`
  - `Synthesizing advice from 5 podcast sources...`
- **Streaming Tokens:** Text streams smoothly into the feed with bouncing amber dots before the first token arrives.
- **Auto-Scroll with User Pause:** Keeps user focused on the streaming output, but respects manual scroll-up.

### 3.3 Artifact Generation & Side-by-Side Transition
- When the assistant outputs `:::artifact{...} ... :::`, the chat stream renders a clean inline **Artifact Card** with an icon, title, and "Open Artifact &rarr;" indicator.
- The **Artifact Panel** on the right slides in smoothly.
- The user can toggle between `Preview` and `Source` (raw Markdown/HTML).
- Multi-artifact switcher allows stepping back and forth between multiple generated artifacts in the same session (`< 1 / 3 >`).
- 1-Click action buttons:
  - **Copy:** Copies raw content to clipboard with 2-second checkmark confirmation.
  - **Download:** Generates downloadable `.md` or `.html` file with sanitized title.
  - **Fullscreen Toggle:** Expands the artifact viewer into full-screen modal mode.

### 3.4 Runtime Model Toggle & API Key Configuration Modal
- Dropdown in the header lists available models:
  - `Ollama: llama3.2:1b` (green dot and "Local" badge; amber dot when unreachable).
  - `Groq: llama-3.3-70b-versatile` (cloud icon).
  - `Anthropic` / `OpenAI` when keys are configured.
- **Add Model Dialog:** allows evaluators to enter their own Groq / OpenAI / Anthropic (or OpenAI-compatible) API key and base URL directly in the UI without editing `.env`.
- Switching models is instant; no page reload or application restart required.

### 3.5 System Health Modal
- The Database icon opens a modal showing the active database engine, connection state, indexed chunk count, and the active runtime.
- When running on the SQLite fallback (PostgreSQL unreachable), an amber note explains the degradation. The backend's `/api/health` status is `healthy` only when DB + index + a model are all usable.

---

## 4. Accessibility & Design Token System

### 4.1 Color Tokens
- `bg-stone-950` (`#0c0a09`): Deep slate-black canvas.
- `bg-stone-900` (`#1c1917`): Elevated surfaces, cards, and input fields.
- `border-stone-800` (`#292524`): Crisp, subtle dividing borders.
- `amber-500` (`#f59e0b`): Primary brand accent, focus rings, and action states.
- `emerald-500` (`#10b981`): Health indicators, local model badge, and success states.

### 4.2 Accessibility Considerations (WCAG 2.1 AA)
- **Contrast Ratios:** Text colors (`stone-100`, `stone-300`) maintain a minimum contrast ratio of $7.2:1$ against `stone-950` surfaces.
- **Keyboard Navigation:** 
  - Full tab traversal across buttons, inputs, and tabs.
  - `Enter` to submit, `Shift+Enter` for multi-line inputs in chat.
- **Reduced Motion:** Animations use subtle transforms ($< 150$ms) and honor CSS `prefers-reduced-motion`.
- **Screen Reader Support:** Interactive buttons feature explicit `title` and `aria-label` attributes; citations are semantic `<a>` tags with `rel="noopener noreferrer"`.
