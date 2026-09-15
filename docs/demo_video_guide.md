# Candidate Demo Video Guide & Script (2–3 Minutes)
## The Lenny Growth Assistant

This script and recording checklist is prepared for recording the **2–3 minute demo video with webcam enabled** required by the Forward Deployed Engineer take-home assessment.

---

## 📹 Video Requirements Checklist
- [ ] **Duration:** Strictly between 2:00 and 3:00 minutes.
- [ ] **Camera:** Webcam enabled in corner (Loom, QuickTime, or OBS).
- [ ] **Must Demonstrate:**
  1. The business problem being solved for product and growth teams.
  2. Grounded Q&A with exact YouTube timestamps.
  3. **Local Ollama running offline on your machine (`llama3.2:1b`)** (mandatory).
  4. Ship 30 for 30 Atomic Essay skill (rendered inline in chat + in Artifact Viewer).
  5. Interactive HTML prototype (live sliders, dynamic math) running in a sandboxed iframe.
  6. Multi-deliverable tab switcher (switching between Ship 30 essay and HTML prototype).
  7. Key technical trade-offs as a Forward Deployed Engineer.
- [ ] **Upload:** Upload as Unlisted or Public to YouTube or Loom.

---

## ⏱️ Minute-by-Minute Script

### [0:00 – 0:30] 1. The Business Problem & Vision
> *"Hi everyone, I'm presenting **The Lenny Growth Assistant**—an enterprise product and growth studio built for product managers, growth operators, and founders.  
> The core problem: *Lenny's Podcast* contains over 300 episodes of world-class advice from iconic leaders like Shreyas Doshi, Elena Verna, and Julie Zhuo. But finding exact operational frameworks takes hours of manual listening. Generic LLMs hallucinate strategies or give textbook advice.  
> As a Forward Deployed Engineer, I turned this raw archive into a deterministic strategic studio that cites exact podcast timestamps, generates publication-grade Ship 30 essays, and compiles live, sandboxed HTML prototypes directly in the browser."*

### [0:30 – 1:15] 2. Grounded Q&A & Local Offline Ollama
*(Show the browser at `http://localhost:5173`. Point to the header)*
> *"Here is the application running locally with a single `./run.sh` command.  
> Notice in the top right header: we are running on **Local Ollama with `llama3.2:1b`**—100% offline on my machine with zero third-party API dependencies and zero data egress.  
> Let's test a strategic question on Karri Saarinen at Linear:  
> *(Paste Prompt 1)*  
> Notice the status bar: our hybrid search engine queries **11,471 dialogue chunks** from 272 podcast episodes.  
> In under 2 seconds, it synthesizes Karri's philosophy: no A/B tests on craft, fluid project teams instead of permanent Scrum squads, and only one Head of Product.  
> Look at the **Verified Podcast Sources** drawer: every point links directly to the exact second in the interview on YouTube—like 9 minutes and 13 seconds."*

### [1:15 – 1:55] 3. Ship 30 for 30 Atomic Essay & Dual-Surface Canvas
> *"Now, product teams don't just chat—they need executive deliverables.  
> Let's request a Ship 30 for 30 atomic essay on Julie Zhuo's North Star Metrics:  
> *(Paste Prompt 2)*  
> The model immediately adopts Nicolas Cole and Dickie Bush's viral digital writing architecture:  
> 1 bold hook, 1 core principle, a 3-bullet breakdown of inputs vs outputs, and a memorable punchline.  
> Crucially, as a Forward Deployed Engineer, I solved the dual-surface problem: the entire 261-word essay renders cleanly inside the chat feed, while simultaneously opening the **Executive Deliverables Canvas** on the right!  
> Here in the Artifact Viewer, we have outline navigation, an exact word counter (261 words), reading time, and 1-click Print to PDF."*

### [1:55 – 2:35] 4. Interactive Sandboxed HTML Prototype & Multi-Deliverable Switcher
> *"Next, let's create a functional tool: Bob Moesta's Jobs-to-be-Done 4 Forces Switching Simulator:  
> *(Paste Prompt 3)*  
> Watch this: instead of dumping code into the chat, the system compiles an interactive web app rendered inside an isolated iframe sandbox.  
> The sandbox enforces strict security—omitting `allow-same-origin` so untrusted code can never access parent session cookies.  
> We can test it live across Desktop, Tablet, and Mobile viewports.  
> Notice the live math: as I drag the sliders for Push, Pull, Anxiety, and Habit, the Net Switching Momentum recalculates dynamically between -100 and +100, and Bob Moesta's tactical playbook updates in real-time!  
> And look at our **Deliverables Switcher** at the top: we have both deliverables preserved! We can switch seamlessly between the Julie Zhuo Ship 30 essay and the Bob Moesta HTML simulator with one click."*

### [2:35 – 3:00] 5. Key Technical Trade-offs & Architecture Wrap-Up
> *"To wrap up, two key architectural trade-offs:  
> First, **Resilience over Rigidity**: while we support PostgreSQL 16, our database adapter automatically degrades to an embedded SQLite WAL database if Postgres is offline, guaranteeing that evaluators can run the repo with zero setup.  
> Second, **Deterministic Grounding**: before calling any LLM, our sub-30ms semantic coverage gate checks token overlap—rejecting out-of-domain queries like 'how to bake bread' with zero hallucination and zero inference cost.  
> Thank you for reviewing The Lenny Growth Assistant!"*

---

## 📋 The 3 Exact Prompts to Paste During Recording

### Prompt 1: Grounded Q&A
```text
How does Karri Saarinen’s philosophy of "Product Craft and Zero-Process" at Linear contrast with traditional Agile and Scrum methodologies? Cite Karri's exact podcast interview with Lenny, explain why Linear rejects standard user story estimation, and compare his approach to Marty Cagan's product discovery principles.
```

### Prompt 2: Ship 30 for 30 Atomic Essay
```text
Write a Ship 30 for 30 style atomic essay on Julie Zhuo's framework for "North Star Metrics vs. Vanity Metrics" and why early-stage teams measure the wrong signals. Follow the strict Ship 30 structure: 1 bold hook, 1 core principle, a 3-bullet breakdown of inputs vs outputs, and a memorable 1-sentence punchline. Keep it between 250 and 300 words.
```

### Prompt 3: Interactive HTML Prototype
```text
Build an interactive HTML/CSS Jobs-to-be-Done (JTBD) Customer Switching Forces Simulator based on Bob Moesta's 4 Forces framework. Include interactive range sliders (0-100) for the 2 Progress Forces (Push of Current Situation, Pull of New Solution) and the 2 Friction Forces (Anxiety of the New, Habit of the Present). Dynamically calculate the Net Switching Probability, display a visual gauge meter, and provide real-time tactical interventions when Habit or Anxiety blocks the switch.
```
