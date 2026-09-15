with open("README.md", "r") as f:
    lines = f.readlines()

new_features = """
### 2. Fortified Polysemy Defenses (Zero-Hallucination)
* **Semantic Intent Overlap:** Standard RAG pipelines fail when faced with polysemy (e.g., asking *"How can I cook food?"* matching a guest named Megan Cook and a testing term like "fish food"). 
* **Hardened Boundary Protocols:** The system prompt employs strict negative-rejection parameters that mandate the LLM check the true semantic intent, catching coincidental vocabulary overlap and immediately blocking the query.
* **Stream Interceptor:** If an LLM attempts to reject a query mid-stream, a custom Python interceptor cleanly wipes stray citations and artifacts, presenting a spotless UI rejection block with suggested fallback topics.

### 3. Deliverables: Ship 30 for 30 Essays & Interactive HTML
* **Atomic Essays:** Transforms dense tactical frameworks into publication-ready ~1,250-word Ship 30 formatted essays, automatically displayed in the Artifact Canvas.
* **Interactive Tool Synthesis:** Generates fully interactive calculators, simulators, and widgets (HTML/JS/Tailwind CSS) grounded in podcast math (e.g. Elena Verna's B2B Growth Loops, Bob Moesta's 4 Forces).
* **Aggressive Iframe Sandboxing:** An advanced sandboxing engine extracts scripts, sanitizes them (DOMPurify), and perfectly injects responsive TailWind shields into `<head>` and `<body>` tags using case-insensitive Regex, guaranteeing perfectly responsive prototypes even when LLMs generate malformed structural markup.

### 4. Flawless UI & Mobile UX
* **Collapsible Action Trays:** Deliverable action buttons (Ship 30, Interactive Prototype) and Suggested Follow-ups are neatly tucked into a `✨ Explore Actions` collapsible dropdown on every message, preventing UI spam.
* **Segmented Mobile Architecture:** Implements a strict tab-switcher on mobile devices, ensuring the Artifact canvas and Chat canvas never squash each other on constrained screens.
"""

for i, line in enumerate(lines):
    if "Deterministic Boundary Gate:" in line:
        lines.insert(i + 1, "\n" + new_features + "\n")
        break

with open("README.md", "w") as f:
    f.writelines(lines)
print("Updated")
