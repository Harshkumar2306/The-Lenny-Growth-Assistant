# Candidate Demo Video Guide & Natural Script (2–2.5 Minutes)
## The Lenny Growth Assistant — Harsh Kumar

This script is crafted in simple, natural, everyday language. It does not rely on memorizing or predicting the AI's exact generated sentences, so you can speak freely, naturally, and confidently like a passionate student builder showing off their project.

---

## 🎬 Before You Hit Record:
- [ ] **Camera:** Webcam turned on in the corner (Loom, QuickTime, or OBS).
- [ ] **Screen:** Browser open to `http://localhost:5173`.
- [ ] **Notepad:** Keep the 3 prompts below open side-by-side to copy and paste quickly.
- [ ] **Time Target:** ~2 minutes to 2.5 minutes (keep an eye on the timer).

---

## 🎙️ Natural Demo Script

### `[0:00 – 0:25]` Intro: Who you are & why you built this
*(Smile at the camera, speak naturally and casually)*

> "Hi everyone! My name is **Harsh Kumar**, and today I want to show you a project I built called **The Lenny Growth Assistant**.
> 
> If you follow Lenny's Podcast, it has over 300 episodes packed with incredible advice from top product leaders. But the big problem is that nobody has time to listen to hundreds of hours of audio just to find a specific framework. And if you ask regular ChatGPT, it often hallucinates or gives generic textbook answers.
> 
> So I wanted to build an assistant that gives **real, verified answers directly from the podcast transcripts**, and can also turn that advice into tangible deliverables like **Ship 30 essays** and **interactive prototypes**."

---

### `[0:25 – 1:05]` Feature 1: Grounded Q&A & Local Ollama
*(Share screen, point mouse to the top right model badge)*

> "First, the coolest part is that this is running **100% locally on my machine** using Ollama and the lightweight `llama3.2:1b` model. There are no paid API keys required, no internet needed, and your data never leaves your computer.
> 
> Let's test a real question about Karri Saarinen, the CEO of Linear, and his philosophy on product craft:"  
> *(Paste Prompt 1 and press Enter)*  
> 
> "Under the hood, it's searching across more than **11,000 dialogue chunks** from the podcast.  
> And look at how quickly it responds! It pulls Karri's exact thoughts directly from the episode transcripts.  
> 
> If you click down here on **Verified Podcast Sources**, it shows the exact YouTube links with timestamps—so anyone can click and verify that the guest actually said it in the interview."

---

### `[1:05 – 1:45]` Feature 2: Ship 30 for 30 Atomic Essay
*(Point mouse to the chat input and paste Prompt 2)*

> "Next, product managers frequently need to communicate ideas clearly and concisely. So I built a dedicated skill for **Ship 30 for 30 atomic essays**.  
> 
> Let's ask it to write an atomic essay on Julie Zhuo's framework for North Star Metrics:"  
> *(Paste Prompt 2 and press Enter)*  
> 
> "Notice the structure: it follows the classic Ship 30 format with a bold hook, a core principle, a clean bullet breakdown of inputs versus outputs, and a memorable punchline.  
> 
> And what I really love here is the layout: you can read the whole essay right inside the chat feed, **and** it also opens up this clean Deliverables canvas on the right side!  
> Here in the panel, we get outline navigation, a live word count, and even a print button to export it as a clean PDF."

---

### `[1:45 – 2:20]` Feature 3: Interactive HTML Prototype & Deliverables Switcher
*(Point mouse to the chat input and paste Prompt 3)*

> "Now, for my favorite feature: instead of just writing text, this assistant can actually **code interactive tools and prototypes for you**.  
> 
> Let's ask it to build an interactive customer switching simulator based on Bob Moesta's Jobs-to-be-Done framework:"  
> *(Paste Prompt 3 and press Enter)*  
> 
> "Look at what happens: instead of dumping raw code into the chat, it automatically builds a real, working web app inside a safe sandbox!  
> *(Drag the sliders left and right)*  
> As I move these sliders around, the math and visualizations update in real time right in front of us.  
> 
> And look at the top bar here: both deliverables are preserved! I can easily click back to the Julie Zhuo essay, and then jump right back into our interactive simulator. Everything stays organized without losing anything."

---

### `[2:20 – 2:40]` Conclusion & Wrap-up
*(Look back at the webcam and smile)*

> "Under the hood, I also added some smart engineering details:  
> If someone asks an off-topic question like 'how do I bake a cake', it immediately catches it in milliseconds and politely declines without wasting compute. And the entire system runs locally with just one simple command: `./run.sh`.  
> 
> Thank you so much for watching!"

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
