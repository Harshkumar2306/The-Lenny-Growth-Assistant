# Candidate Demo Video Guide & Script (2–3 Minutes)
## The Lenny Growth Assistant

This script and recording checklist is prepared to help you record the **2–3 minute video with your camera enabled** required by Section 6 & 8 of the Oogway Labs assessment.

---

## 📹 Video Requirements Checklist
- [ ] **Duration:** 2 to 3 minutes (stay strictly within this window).
- [ ] **Camera:** Your webcam enabled in the corner (e.g. Loom, QuickTime, or OBS).
- [ ] **Demonstrate:**
  1. The business problem being solved.
  2. The working product (UI, grounded answers, citations).
  3. **Local Ollama running on your machine** (mandatory).
  4. Ship 30 for 30 essay skill & Claude-style Artifact Viewer.
  5. One key technical trade-off you navigated as a Forward Deployed Engineer.
- [ ] **Upload:** Upload as Unlisted or Public to YouTube and paste the link into the submission form.

---

## ⏱️ Minute-by-Minute Script & Walkthrough

### [0:00 – 0:35] 1. The Problem & Business Context (Camera On)
> *"Hi everyone, I'm presenting The Lenny Growth Assistant, an internal strategic copilot built for product and growth teams.  
> The core business problem: Lenny's Podcast contains 300+ episodes of world-class advice from top operators like Shreyas Doshi and Elena Verna. But for a growth team, finding exact tactical playbooks takes hours of manual listening. Generic AI chatbots hallucinate or give textbook answers.  
> As a Forward Deployed Engineer, my goal was to turn this raw repository into an enterprise-ready, fully grounded assistant that cites exact podcast moments, generates reusable Ship 30 for 30 essays, and renders live artifacts natively in the browser."*

### [0:35 – 1:30] 2. Product Walkthrough & Local Ollama Demonstration
*(Switch to screen share with your camera bubble in the corner)*
> *"Here is the application running locally with a single command `./run.sh`.  
> Notice in the top header: our active runtime is **Local Ollama with `llama3.2:1b`**, completely offline on my Mac without sending data to third-party APIs.  
> Let's test a grounded question: 'What does Shreyas Doshi teach about pre-mortems?'  
> *(Type prompt and hit Enter)*  
> Notice the real-time status: it retrieves from our index of **~6,000 dialogue chunks**.  
> Here is Shreyas Doshi's exact framework: Tigers, Paper Tigers, and Elephants in the room.  
> And down here is our **Verified Podcast Sources** drawer: with one click, we see direct links to the YouTube episode with the exact timestamp at 24 minutes and 50 seconds."*

### [1:30 – 2:10] 3. Ship 30 for 30 Skill & Claude-Style Artifact Viewer
> *"Now, product teams don't just want conversation—they need written deliverables.  
> Let's click **'Turn into Ship 30 for 30 Essay (~1,250 words)'**.  
> *(Click button)*  
> Our specialized Ship 30 skill pipeline kicks in, encoding Nicolas Cole and Dickie Bush's exact writing methodology: a magnetic hook, 1-3-1 sentence cadence, and 3 to 5 tactical pillars.  
> Notice how the **Artifact Panel pops open side-by-side**—just like Claude Artifacts!  
> Users can toggle between **Preview** and **Source Code**, copy with one click, or export to Markdown.  
> If we ask for an interactive PMF calculator widget, it renders interactive HTML in a **secure sandboxed iframe** with script isolation, ensuring untrusted LLM-generated code cannot access parent cookies or local storage."*

### [2:10 – 2:50] 4. Key Technical Trade-off (Forward Deployed Engineering)
> *"One crucial technical trade-off I made was around **Model Runtime & Deployment Resilience**:  
> Running local models with Ollama is fantastic for privacy and offline demos, but local compute is constrained by memory and latency on complex 1,250-word essays.  
> Rather than locking the team into one provider, I architected a **Flexible Multi-Model Gateway** with a dynamic runtime switcher in the header. We can toggle seamlessly between local Ollama and cloud Groq without changing a single line of application code.  
> Furthermore, if PostgreSQL is not available in the evaluator's environment, our database adapter automatically falls back to local SQLite with zero downtime.  
> This ensures that any engineering team can clone, run `./run.sh`, and trust the system immediately.  
> Thank you!"*

---

## 🎬 Tips for Recording
1. **Loom or QuickTime:** Loom is easiest because it places your camera circle over your screen recording automatically.
2. **Resolution:** 1080p recommended.
3. **Sound:** Use a clear microphone or headset.
4. **YouTube Settings:** Select "Unlisted" so anyone with the link can view.

---

## ✅ Phase 4 Validation Note (guide checked against the live app)

This script was re-validated against the running application during Phase 4
(2026-09-13) — every UI element referenced above exists verbatim in the live
app: the header runtime switcher, the **Verified Podcast Sources (N)** drawer
with timestamped YouTube links, the **Turn into Ship 30 for 30 Essay
(~1,250 words)** button, the side-by-side Artifact Viewer with Preview/Source
and Copy/Download, and the sandboxed HTML preview (banner:
"Sandboxed Execution").

**Pre-flight checklist before you hit record** (each step matches
`docs/manual_test_plan.md`):

- [ ] `./run.sh` boots backend (:8000) + frontend (:5173) and the health modal shows `healthy` with the index loaded (~5,993 chunks) — UI-01, UI-09.
- [ ] Ollama is running and the header shows `ollama (llama3.2:1b)` with a green dot.
- [ ] Grounded query flows: *"What does Shreyas Doshi say about pre-mortems?"* returns citations and streaming advice — UI-03.
- [ ] One rejection example is ready in a second tab if you want to show boundaries: *"What is the best recipe for chocolate cake?"* — UI-04.
- [ ] Ship 30 button flow works (essay artifact opens the viewer) — UI-05, UI-06.
- [ ] PMF calculator flow works (interactive sandboxed HTML) — UI-07.
- [ ] Model switcher shows Ollama → Groq toggle without reload — UI-08.
