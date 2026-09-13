# Agent Transcript 05: Ship 30 for 30 Skill & Artifact Sandbox Security

**Phase:** Agent Skills & Frontend Security  
**Date:** 2026-09-12  
**Status:** Completed  

---

## 1. Encoding Nicolas Cole & Dickie Bush's Ship 30 for 30 Methodology
Rather than relying on a generic prompt ("write an essay"), we built a dedicated skill pipeline in `backend/app/services/ship30_skill.py` that encodes the 7 core Ship 30 for 30 principles:
1. **Headline & Hook:** 1-sentence provocative opening using the Rule of One (one reader, one problem, one outcome).
2. **The Lead-In (Stakes):** Explaining why conventional wisdom fails 90% of product teams.
3. **1-3-1 Cadence:** Alternating sentence cadences (1 bold single line, 2–3 sentence mechanism, 1 punchy conclusion) to maximize reading velocity.
4. **Skimmable Visual Architecture:** H2/H3 subheads with bold first words for rapid eye tracking.
5. **3 to 5 Actionable Pillars:** Grounded explicitly in Lenny's podcast guests with direct quotes and tactical operational playbooks.
6. **24-Hour Action Plan:** Actionable takeaway checklist.
7. **Target Depth:** ~1,250 words.

## 2. Failed Attempt: Model Output Variations in Artifact Tags
During live Ollama generation with `llama3.2:1b`, the model generated:
`:::artifact{id="b1a4f5eb"} type="markdown" title="Pre-Mortem Template"}`
Notice the closing curly bracket right after `id`!
- **Initial Rigid Regex:** Looked for `{id="..." type="..." title="..."}` inside a single closed bracket, causing the parser to treat the attributes as markdown content.
- **Correction:** Rewrote `_parse_artifacts` to treat the entire line following `:::artifact` as the attribute definition:
  `pattern = re.compile(r':::artifact([^\n]*)\n(.*?)(\n:::|$)', re.DOTALL)`
  Extracted `id`, `type`, and `title` using individual resilient regex searches.

## 3. Defense-in-Depth HTML Security Sandbox
Section 4.3 mandates:
> *"Treat generated HTML as untrusted. Explain and implement a reasonable isolation or sanitization strategy for artifact rendering. The evaluator should be able to understand what the viewer permits, blocks, and why."*

We implemented a 3-layer defense:
1. **DOMPurify Sanitization:** Strips malicious script vectors before injection.
2. **Sandboxed Iframe:**
   - Permitted: `sandbox="allow-scripts"` (allows JavaScript for interactive calculators, charts, and prototype tabs).
   - Blocked: **NO** `allow-same-origin`. The iframe executes under an opaque origin `null`, strictly preventing access to `parent.document`, `localStorage`, or `document.cookie`.
3. **Strict Content-Security-Policy:**
   Injected CSP restricts script execution to local inline code and verified CDNs (`cdn.tailwindcss.com`, `cdn.jsdelivr.net`), blocking outbound data exfiltration.
