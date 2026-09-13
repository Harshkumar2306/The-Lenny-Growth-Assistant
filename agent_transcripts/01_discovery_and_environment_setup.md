# Agent Transcript 01: Discovery, Environment Setup, & LLM Strategy

**Phase:** Discovery & Setup  
**Date:** 2026-09-12  
**Status:** Completed  

---

## 1. Objective
Analyze the Oogway Labs take-home assessment brief ("The Lenny Growth Assistant") and evaluate local compute capabilities, runtime constraints, and model strategy.

## 2. Discovery Logs & Tool Invocations
- Checked system binaries:
  - Python 3.13 was default in `/Library/Frameworks/`, but Python 3.12 (`/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`) was available and selected for maximum stability with PyTorch/scikit-learn/FastAPI wheels.
  - Node `v26.4.0` and npm were installed via Homebrew.
  - Ollama was installed via Homebrew at `/opt/homebrew/bin/ollama`.
  - Docker was not installed on the host system.

## 3. The Groq vs. Ollama Strategy Decision
The candidate asked: *"Can I use Groq Qwen API in place of Ollama?"*
- **Brief Analysis:** Section 3.2 and Section 8 mandate:
  > *"Local LLM—mandatory for the demo: Run the submitted demo using Ollama and a model that works comfortably on your machine."*  
  > *"Record a 2–3 minute video... demonstrate local Ollama, and briefly cover one important technical trade-off."*
- **Engineering Resolution:**
  We decided on a **Dual Model Architecture**:
  1. **Local Model:** Pulled `llama3.2:1b` (1.3 GB) via Ollama. It downloads in 30 seconds, uses $< 1.5$ GB VRAM, and streams smoothly on Mac Metal/CPU.
  2. **Cloud Model:** Integrated Groq (`llama-3.3-70b-versatile` and `qwen-2.5-32b`) as the Cloud provider for ultra-fast long-form Ship 30 essays.
  3. **UI Model Switcher:** Added a dynamic dropdown in the UI header to seamlessly toggle between Local Ollama and Cloud Groq at runtime without code changes.

## 4. Transcript Repository Selection
- Queried GitHub API for official Lenny transcripts archive.
- Selected `ChatPRD/lennys-podcast-transcripts` containing 303 episodes with structured YAML frontmatter (`guest`, `title`, `youtube_url`, `publish_date`, `keywords`) and speaker-turn timestamps.
- Cloned shallow repository into `data/transcripts_raw/`.
