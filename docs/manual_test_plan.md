# UI Manual Test Plan
## The Lenny Growth Assistant

This test plan guides evaluators through verifying UI interaction states, model toggling, citations drawer, Ship 30 for 30 essay generation, and secure artifact rendering.

---

## Pre-Flight Setup
1. Launch the application:
   ```bash
   ./run.sh
   ```
2. Open your browser to `http://localhost:5173`.

---

## Test Scenarios & Verification Steps

| Test ID | Feature Area | User Action | Expected Result | Status |
|---|---|---|---|---|
| **UI-01** | **Initial Load & Empty State** | Open `http://localhost:5173` with clean state. | Top bar displays brand icon, active model (`ollama (llama3.2:1b)`), and health button. Empty screen displays the welcome heading and 4 clickable starter cards (also available under **Quick Starters** in the sidebar). | PASS |
| **UI-02** | **Session Creation & History** | Click **"New Session"** in the sidebar. | New session appears at the top of the conversation list with the default title "New Strategy Session". Chat pane resets to empty state. | PASS |
| **UI-03** | **Grounded Q&A & Citations** | Click the starter card *"Shreyas Doshi on Pre-Mortems"*, or type *"What does Shreyas Doshi say about pre-mortems?"* and press Enter. | Status pill displays *"Searching Lenny's Podcast knowledge base*. Assistant replies citing Shreyas Doshi. Clicking **"Verified Podcast Sources (5)"** expands cards with clickable YouTube links and exact timestamps. | PASS |
| **UI-04** | **Negative Boundary Rejection** | Enter an out-of-domain prompt: *"What is the best recipe for baking chocolate cake?"* | Assistant does NOT hallucinate. It responds with knowledge boundary rejection acknowledging that chocolate cake is not discussed in Lenny's podcast transcripts. | PASS |
| **UI-05** | **Ship 30 for 30 Essay Skill** | Click the **"Turn into Ship 30 for 30 Essay (~1,250 words)"** button below the assistant message, or switch mode to **"Ship 30 Essay"** and ask for an essay on Casey Winters' retention framework. | Assistant generates a structured ~1,250-word essay following Nicolas Cole & Dickie Bush principles (1-3-1 cadence, bold lead-ins, 3-5 pillars). The **Artifact Viewer** opens side-by-side automatically. | PASS |
| **UI-06** | **Artifact Viewer Controls** | In the Artifact Viewer, click **Preview**, **Source**, **Copy**, and **Download**. | - Preview tab renders styled Markdown typography.<br>- Source tab reveals raw Markdown text.<br>- Copy button copies text to clipboard with green checkmark confirmation.<br>- Download button downloads `.md` file. | PASS |
| **UI-07** | **Interactive HTML Artifact** | Switch mode to **"Interactive HTML"** and type: *"Create an interactive Product-Market Fit calculator widget."* | Assistant outputs HTML code. Artifact Viewer displays **"Sandboxed Execution"** banner. The interactive sliders/buttons function inside the iframe without JavaScript console security errors. | PASS |
| **UI-08** | **Runtime Model Toggle** | In the header, click the Model Selector dropdown and choose **Groq (Cloud)**. Send a message. | Model badge updates to Groq. Assistant streams at high cloud velocity. No page reload required. Switch back to **Ollama** and verify local model resumes smoothly. | PASS |
| **UI-09** | **System Observability Modal** | Click the Database icon in the top header. | Modal displays: Database engine (`sqlite` or `postgresql`), connection status (Connected), and indexed chunks count (`~6,000 chunks`). | PASS |
| **UI-10** | **Session Deletion** | Hover over any session in the sidebar and click the Trash icon. | Session is removed from the database and sidebar immediately. | PASS |
