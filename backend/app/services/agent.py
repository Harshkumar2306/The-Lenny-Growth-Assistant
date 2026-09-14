import re
import json
import uuid
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.services.rag_engine import rag_engine
from app.services.llm_gateway import llm_gateway, LLMProviderError
from app.services.ship30_skill import SHIP30_SYSTEM_PROMPT, build_ship30_prompt
from app.services.ship30_synthesizer import synthesize_ship30_essay
from app.services.html_artifact_synthesizer import synthesize_html_artifact
from app.schemas.chat_schemas import CitationItem, ArtifactItem

BASE_SYSTEM_PROMPT = """You are "The Lenny Growth Assistant", an elite product management and growth advisor grounded strictly in the collective wisdom of Lenny's Podcast interviews with 300+ world-class founders and product leaders.

### CORE OPERATING RULES:
1. GROUNDING & EVIDENCE:
   - Answer strictly and authoritatively using the provided podcast transcript excerpts.
   - Always attribute insights to the specific guest (e.g., "According to Shreyas Doshi...", "Elena Verna argues that...").
   - When citing, reference the episode title and context.

2. STRICT BOUNDARIES & NEGATIVE REJECTION:
   - If the user asks a question that is NOT addressed in Lenny's Podcast transcripts, explicitly and politely acknowledge:
     "Based on the transcripts in the Lenny's Podcast knowledge base, this topic is not discussed by any of the guests. I can only provide advice grounded in Lenny's podcast repository (product management, growth loops, monetization, hiring, and company building)."
   - Never invent or hallucinate advice outside of the podcast transcripts.

3. PRESENTATION & FORMATTING STANDARDS:
   - Always structure your response using clear Markdown headings (e.g. `### Core Framework`, `### Tactical Takeaways`).
   - Use bullet points (`- `) with **bold lead-ins** for every actionable insight (e.g. `- **Point Name**: Explanation...`).
   - When presenting comparative analysis, competitor breakdowns, or features, ALWAYS format them as clean Markdown tables:
     | Dimension / Feature | Option A | Option B |
     | :--- | :--- | :--- |
   - Never output flat unformatted text. Separate distinct concepts with clean double-spacing.
   - Provide your direct conversational response in Markdown. Do NOT wrap your answer in :::artifact blocks.
"""

class AgentService:
    def is_greeting_or_meta(self, message: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', message.lower()).strip()
        greetings = {
            "hi", "hello", "hey", "hlo", "howdy", "greetings", "good morning", "good afternoon", "good evening",
            "who are you", "who are u", "what are you", "what can you do", "what do you do",
            "how can you help", "how does this work", "help",
            "hi who are you", "hello who are you", "hey who are you", "hi what can you do", "hello what can you do"
        }
        if clean in greetings:
            return True
        words = clean.split()
        if len(words) <= 4 and all(w in ["hi", "hello", "hey", "hlo", "there", "lenny", "assistant", "bot", "ai", "who", "are", "you", "what", "can", "do"] for w in words):
            return True
        return False

    def _detect_intent(self, message: str, skill: Optional[str]) -> Dict[str, bool]:
        """Route the request to chat / ship30 / html-artifact modes.

        Prompt content is authoritative: explicit format requests in the prompt
        always override sticky UI tab selections.
        """
        msg_lower = message.lower()

        # 1. High-confidence explicit Ship 30 essay intent in prompt
        is_prompt_ship30 = bool(
            re.search(
                r'\b(?:ship\s*30\s+for\s+30|ship\s*30\s+essay|ship\s*30|atomic\s+essay|turn\s+into\s+(?:a\s+)?ship\s*30|write\s+(?:a\s+)?ship\s*30)\b',
                msg_lower
            )
        )

        # 2. High-confidence explicit HTML / Prototype / Simulator intent in prompt
        is_prompt_html = bool(
            re.search(
                r'\b(?:html|css|prototype|widget|calculator|simulator|dashboard)\b|\b(?:interactive\s+code|interactive\s+tool|interactive\s+sliders|pmf\s+engine)\b',
                msg_lower
            )
        )

        # Disambiguate when prompt mentions both (e.g. "Ship 30 essay about HTML dashboards")
        if is_prompt_ship30 and is_prompt_html:
            if re.search(r'\b(?:ship\s*30|essay|article|post)\b', msg_lower):
                return {"ship30": True, "html": False}
            return {"ship30": False, "html": True}

        if is_prompt_ship30:
            return {"ship30": True, "html": False}

        if is_prompt_html:
            return {"ship30": False, "html": True}

        # 3. If prompt is neutral, fall back to explicit UI selection
        if skill == "ship30":
            return {"ship30": True, "html": False}
        if skill == "artifact":
            return {"ship30": False, "html": True}

        # 4. Default: pure Grounded Q&A Chat
        return {"ship30": False, "html": False}

    async def process_chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        skill: Optional[str] = "chat",
        session_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        history = history or []
        session_id = session_id or str(uuid.uuid4())

        # Route request intent (explicit UI skill > text heuristics)
        intent = self._detect_intent(message, skill)
        is_ship30 = intent["ship30"]
        is_html_artifact = intent["html"]

        # Conversational greeting / meta question handling (avoids pulling random low-relevance quotes)
        if self.is_greeting_or_meta(message):
            yield {"type": "status", "data": "Ready to advise..."}
            yield {"type": "citations", "data": []}

            greeting_response = (
                "👋 **Hello! I'm The Lenny Growth Assistant.**\n\n"
                "I am an elite product and growth advisor strictly grounded in the collective wisdom of **300+ Lenny's Podcast episodes** "
                "with world-class founders, operators, and product leaders.\n\n"
                "### How I can help you:\n"
                "- **Product Strategy & PMF:** Superhuman's PMF engine (Rahul Vohra), pre-mortems (Shreyas Doshi), pricing & packaging\n"
                "- **Growth Loops & Retention:** B2B PLG flywheels (Elena Verna), acquisition loops (Casey Winters), habit loops (Nir Eyal)\n"
                "- **Execution & Artifacts:** Generate ready-to-use PRDs, checklists, interactive HTML prototypes, or **Ship 30 for 30 essays**\n\n"
                "What product or growth challenge are you tackling today?"
            )
            chunk_size = 18
            for i in range(0, len(greeting_response), chunk_size):
                yield {"type": "token", "data": greeting_response[i:i+chunk_size]}

            yield {
                "type": "done",
                "data": {
                    "session_id": session_id,
                    "full_content": greeting_response,
                    "artifacts_count": 0,
                    "suggestions": [
                        "How does Shreyas Doshi run effective pre-mortems?",
                        "What are Elena Verna's B2B growth loops?",
                        "How did Superhuman measure product-market fit?"
                    ]
                }
            }
            return

        yield {"type": "status", "data": "Searching Lenny's Podcast knowledge base..."}

        # Step 1: Context-aware query expansion for short follow-up questions
        retrieval_query = message
        if history and len(message.split()) < 7:
            last_user_msg = next((h["content"] for h in reversed(history) if h.get("role") == "user"), "")
            if last_user_msg:
                retrieval_query = f"{last_user_msg[:120]} {message}"

        # Clean meta-prompt deliverable phrasing from retrieval query so RAG scores the core domain topic
        topic_cleaned = re.sub(
            r'^\s*(?:write|draft|create|generate|turn\s+into|build|make)\s+(?:an?\s+)?(?:executive\s+)?(?:ship\s*30(?:\s+for\s+30)?\s+essay|interactive\s+html\s+prototype|atomic\s+essay|prototype|widget|simulator|calculator)?\s*(?:on|about|for|based\s+on)?\s*',
            '',
            retrieval_query,
            flags=re.IGNORECASE
        ).strip()
        if topic_cleaned and len(topic_cleaned.split()) >= 2:
            retrieval_query = topic_cleaned

        # Retrieval queries are capped at a topic-bearing prefix. The
        # "Turn into Ship 30 for 30 Essay" button pastes the full grounded
        # answer (450 chars) as the message; scoring essay-length text floods
        # the lexical coverage gate with words no single chunk can contain
        # and force-rejects an in-domain request. The leading words carry the
        # topic; the full message still reaches the generation prompt below.
        MAX_RETRIEVAL_WORDS = 60
        retrieval_words = retrieval_query.split()
        if len(retrieval_words) > MAX_RETRIEVAL_WORDS:
            retrieval_query = " ".join(retrieval_words[:MAX_RETRIEVAL_WORDS])

        # Hybrid retrieval
        chunks, citations, max_score = rag_engine.search(retrieval_query, top_k=5)
        if max_score < 0.12 and retrieval_query != message:
            # Query expansion must never poison a legitimate short follow-up:
            # if the previous turn was out-of-domain (rejected), its words
            # dilute the coverage gate. Retry on the raw message alone (capped
            # by the same prefix rule so long pasted text cannot re-flood it).
            raw_words = message.split()
            retry_query = " ".join(raw_words[:MAX_RETRIEVAL_WORDS]) if len(raw_words) > MAX_RETRIEVAL_WORDS else message
            chunks, citations, max_score = rag_engine.search(retry_query, top_k=5)

        # Step 2: Grounding boundary check
        # If score is very low (< 0.12) and not a follow-up, reject gracefully.
        # IMPORTANT: citations are only emitted AFTER the boundary check so
        # rejected answers never display low-relevance junk sources.
        if max_score < 0.12 or not chunks:
            yield {"type": "citations", "data": []}
            rejection_text = (
                "Based on the transcripts in the Lenny's Podcast knowledge base, this specific topic "
                "is not covered in the available episodes. I am strictly grounded in Lenny's podcast archives "
                "covering product management, growth, retention, hiring, and startup strategy.\n\n"
                "Feel free to ask about topics like **Shreyas Doshi on pre-mortems**, **Elena Verna on B2B product-led growth**, "
                "**Casey Winters on growth loops**, or **Rahul Vohra on measuring Product-Market Fit**."
            )
            yield {"type": "token", "data": rejection_text}
            yield {
                "type": "done",
                "data": {
                    "rejection": True,
                    "session_id": session_id,
                    "full_content": rejection_text,
                    "suggestions": [
                        "What are Shreyas Doshi's top product frameworks?",
                        "How does Elena Verna explain B2B growth loops?",
                        "How to measure Product-Market Fit according to Rahul Vohra?"
                    ]
                }
            }
            return

        yield {
            "type": "citations",
            "data": [c.model_dump(mode="json") for c in citations]
        }

        yield {"type": "status", "data": f"Synthesizing advice from {len(citations)} podcast sources..."}

        # Preflight: fail fast with a structured, actionable error if the selected
        # provider cannot serve the request (missing key, Ollama offline, etc.).
        # Runs AFTER retrieval grounding so out-of-domain rejections and
        # greetings work even when no model runtime is available.
        try:
            await llm_gateway.validate_provider(provider, model)
        except LLMProviderError as e:
            logger.error(
                f"Provider preflight failed for {e.provider}",
                extra={"provider": e.provider, "detail": e.detail},
            )
            yield {"type": "error", "data": e.message}
            yield {
                "type": "done",
                "data": {
                    "session_id": session_id,
                    "error": e.message,
                    "provider_error": True,
                    "suggestions": [
                        "Switch to Ollama and make sure 'ollama serve' is running",
                        "Add a Groq API key via the model menu"
                    ]
                }
            }
            return

        # Step 3: Build Context & Prompt
        # For cloud providers with strict TPM limits (like Groq 8K TPM on Qwen),
        # use the top 3 highest-scoring chunks and compact them to core paragraphs (~250 words each)
        # to ensure prompt tokens remain well under 1,500 tokens.
        effective_provider = (provider or settings.ACTIVE_PROVIDER or "ollama").lower()
        if effective_provider == "groq":
            prompt_chunks = []
            for c in chunks[:3]:
                c_copy = dict(c)
                words = c.get("text", "").split()
                if len(words) > 250:
                    c_copy["text"] = " ".join(words[:250]) + "..."
                prompt_chunks.append(c_copy)
        else:
            prompt_chunks = chunks

        context_str = ""
        for i, c in enumerate(prompt_chunks):
            context_str += f"\n--- Source {i+1}: {c['guest']} - \"{c['title']}\" (Timestamp: {c['timestamp']}) ---\n"
            context_str += f"{c['text']}\n"

        if is_ship30:
            system_prompt = SHIP30_SYSTEM_PROMPT
            user_prompt = build_ship30_prompt(message, prompt_chunks)
        elif is_html_artifact:
            system_prompt = (
                f"{BASE_SYSTEM_PROMPT}\n\n"
                f"You are also an elite Frontend UI/UX Engineer. When generating an interactive tool, simulator, calculator, or widget:\n"
                f"1. RESPONSIVE DESIGN IS CRITICAL: The tool must look gorgeous and fit cleanly across all screen widths (360px to 1024px) without horizontal overflow or cutoffs.\n"
                f"   - Group each slider/metric into its own card container with a label and live numeric value badge on top (`flex justify-between items-center mb-1`), and a full-width range slider underneath (`w-full`).\n"
                f"   - Use responsive grid or vertical flex stack (`grid grid-cols-1 sm:grid-cols-2 gap-4` or `flex flex-col gap-4`). Never place multiple sliders in a single unconstrained horizontal row.\n"
                f"2. MODERN STYLING: Use Tailwind CSS with clean cards (`bg-white shadow-sm border border-slate-200 rounded-xl p-4`), clear typography, and vibrant accent colors.\n"
                f"3. DYNAMIC INTERACTION: Provide working vanilla JavaScript with live event listeners (`input`, `change`) that instantly update calculations, visual meters, and tactical recommendations.\n"
                f"4. DELIMITER INTEGRITY: Place the complete HTML inside:\n"
                f":::artifact{{id=\"{str(uuid.uuid4())[:8]}\" type=\"html\" title=\"{message[:40]}\"}}\n"
                f"<!DOCTYPE html><html><head><script src=\"https://cdn.tailwindcss.com\"></script></head><body class=\"p-4 sm:p-6 bg-slate-50 font-sans\">...</body></html>\n"
                f":::\n"
                f"Close the artifact with `:::` on its own line immediately after </html>. Do NOT put markdown explanations or notes inside the artifact block. Write any conversational explanations outside the artifact."
            )
            user_prompt = (
                f"User request: {message}\n\n"
                f"Podcast Evidence:\n{context_str}\n\n"
                f"Generate the complete, responsive interactive artifact and explain the tactical takeaways."
            )
        else:
            system_prompt = BASE_SYSTEM_PROMPT
            user_prompt = (
                f"User Question: {message}\n\n"
                f"Lenny's Podcast Transcript Excerpts:\n{context_str}\n\n"
                f"RESPONSE FORMAT & PRESENTATION RULES:\n"
                f"1. Ground your answer strictly in the transcript excerpts, citing the guest by name.\n"
                f"2. Use `### ` Markdown headings to clearly separate distinct themes or frameworks.\n"
                f"3. Use bullet points (`- `) with **bold lead-ins** for every tactical takeaway.\n"
                f"4. If presenting a comparison, framework, or competitor breakdown, format it as a clean Markdown table with headers.\n"
                f"5. Answer directly in conversational Markdown. Do NOT use :::artifact tags."
            )

        # Build messages payload
        messages = [{"role": "system", "content": system_prompt}]
        # Include recent 4 history messages for conversational context
        for h in history[-4:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": user_prompt})

        # Step 4: Stream response and detect artifacts
        full_content = ""
        stream_success = False
        try:
            async for token in llm_gateway.stream_chat(messages, provider=provider, model=model):
                full_content += token
                stream_success = True
                yield {"type": "token", "data": token}
        except LLMProviderError as e:
            logger.warning(
                f"LLM provider failure mid-stream ({e.provider}): {e.message}",
                extra={"provider": e.provider, "detail": e.detail},
            )
            # If a cloud provider failed (e.g. Groq 429 rate limit or network issue) and no/little content streamed,
            # gracefully fall back to local Ollama!
            is_cloud_fail = (effective_provider != "ollama") and (
                "429" in e.message or "rate limit" in e.message.lower() or "timeout" in e.message.lower() or "503" in e.message or "blocked" in e.message.lower() or "error" in e.message.lower()
            )
            if is_cloud_fail and len(full_content.strip()) < 40:
                full_content = ""
                yield {"type": "status", "data": "Groq rate limit reached (8K TPM). Seamlessly switching to local Llama 3.2..."}
                try:
                    async for token in llm_gateway.stream_chat(messages, provider="ollama", model=settings.DEFAULT_LOCAL_MODEL):
                        full_content += token
                        stream_success = True
                        yield {"type": "token", "data": token}
                except Exception as local_err:
                    logger.error(f"Local Ollama fallback also failed: {local_err}")

            if not stream_success:
                if full_content:
                    yield {"type": "status", "data": f"Stream interrupted: {e.message}"}
                else:
                    yield {"type": "error", "data": e.message}
                yield {
                    "type": "done",
                    "data": {
                        "session_id": session_id,
                        "error": e.message,
                        "provider_error": True,
                        "full_content": full_content,
                        "artifacts_count": 0,
                        "suggestions": ["Switch to Ollama in the top header", "Wait a few seconds for Groq rate limit to reset"]
                    }
                }
                return

        # Step 5: Parse artifacts or synthesize deliverables
        if is_ship30 or is_html_artifact:
            artifacts = self._parse_artifacts(full_content, session_id)
        else:
            # Pure Grounded Q&A: Never emit artifacts, strip any stray artifact tags
            artifacts = []
            full_content = re.sub(
                r':::artifact\s*(?:\{[^}]*\}|[^\n]*)\s*([\s\S]*?)(?::::|$)',
                r'\1',
                full_content
            ).strip()
            full_content = re.sub(r'^\s*:::\s*$', '', full_content, flags=re.MULTILINE).strip()

        # Ship 30 Deliverable Processing: Ensure publication-ready depth and accurate title
        if is_ship30:
            ship30_art = next((a for a in artifacts if a.artifact_type == "markdown"), None)

            # Check if parsed artifact has sufficient publication depth (>= 2200 chars)
            # and is not titled with a placeholder like 'Magnetic Headline'
            is_valid_depth = (
                ship30_art is not None and
                len(ship30_art.content) >= 2200 and
                ship30_art.title.lower() not in ["magnetic headline", "essay", "untitled", "growth artifact", "artifact"]
            )

            if not is_valid_depth:
                synth_title, synth_content = synthesize_ship30_essay(message, full_content, chunks)
                if ship30_art:
                    ship30_art.title = synth_title
                    ship30_art.content = synth_content
                else:
                    ship30_art = ArtifactItem(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        artifact_type="markdown",
                        title=synth_title,
                        content=synth_content,
                        version=1
                    )
            else:
                # Sanitize placeholder title if needed
                if ship30_art.title.lower() in ["magnetic headline", "essay", "untitled"]:
                    title_match = re.search(r'^#\s+(.+)$', ship30_art.content, re.MULTILINE)
                    if title_match and title_match.group(1).lower() != "magnetic headline":
                        ship30_art.title = title_match.group(1).strip()
                    else:
                        clean_topic = re.sub(r'^\s*(?:write|draft|turn\s+into)\s+(?:an?\s+)?(?:executive\s+)?(?:ship\s*30(?:\s+for\s+30)?\s+essay)?\s*(?:on|about)?\s*', '', message, flags=re.IGNORECASE).strip()
                        ship30_art.title = f"Ship 30: {clean_topic[:45]}"

                # Strip # Magnetic Headline from content if present
                ship30_art.content = re.sub(r'^#\s+Magnetic Headline\s*\n+', '', ship30_art.content, flags=re.IGNORECASE).strip()

            artifacts = [ship30_art]

        elif is_html_artifact:
            # Check if an HTML artifact was properly captured, is self-contained,
            # and meets executive UI/UX quality standards (modern styling, reactive sliders/inputs)
            valid_html_art = None
            for a in artifacts:
                if a.artifact_type == "html":
                    c_lower = a.content.lower()
                    has_modern_styling = "tailwind" in c_lower or "rounded-" in c_lower or "bg-slate" in c_lower or "bg-zinc" in c_lower or "bg-stone" in c_lower or "bg-neutral" in c_lower
                    has_reactive_controls = 'type="range"' in c_lower or "addeventlistener" in c_lower or "oninput" in c_lower
                    is_substantial = len(a.content) >= 1200
                    no_external_stubs = "styles.css" not in c_lower and "script.js" not in c_lower

                    if is_substantial and has_modern_styling and has_reactive_controls and no_external_stubs:
                        valid_html_art = a
                        break

            # If not a complete, styled interactive prototype, synthesize with grounded templates
            if not valid_html_art:
                synth_title, synth_html = synthesize_html_artifact(message, full_content, chunks)
                art_id = str(uuid.uuid4())
                html_art = ArtifactItem(
                    id=art_id,
                    session_id=session_id,
                    artifact_type="html",
                    title=synth_title,
                    content=synth_html,
                    version=1
                )
                artifacts = [html_art]
            else:
                artifacts = [valid_html_art]

            # Strip raw HTML dumps and artifact delimiters from the chat message
            # so the chat feed stays clean while the artifact renders in the side panel
            full_content = re.sub(
                r':::artifact\s*(?:\{[^}]*\}|[^\n]*)\s*([\s\S]*?)(?::::|$)',
                r'',
                full_content
            ).strip()
            full_content = re.sub(r'<!DOCTYPE\s+html[\s\S]*?</html>', '', full_content, flags=re.IGNORECASE).strip()
            full_content = re.sub(r'<html[\s\S]*?</html>', '', full_content, flags=re.IGNORECASE).strip()
            full_content = re.sub(r'```html[\s\S]*?```', '', full_content, flags=re.IGNORECASE).strip()
            full_content = re.sub(r'^\s*:::\s*$', '', full_content, flags=re.MULTILINE).strip()

        for art in artifacts:
            yield {"type": "artifact", "data": art.model_dump(mode="json")}

        suggestions = self._generate_suggestions(message, citations)

        yield {
            "type": "done",
            "data": {
                "session_id": session_id,
                "full_content": full_content,
                "artifacts_count": len(artifacts),
                "suggestions": suggestions
            }
        }

    def _generate_suggestions(self, message: str, citations: List[CitationItem]) -> List[str]:
        suggestions = []
        msg_lower = message.lower()
        top_guest = citations[0].guest if citations else ""

        if "pre-mortem" in msg_lower or "shreyas" in msg_lower:
            suggestions.append("How do Tigers differ from Paper Tigers in pre-mortems?")
            suggestions.append("What are Shreyas Doshi's Three Levels of Product Work?")
            suggestions.append("Turn Shreyas's advice into a Ship 30 for 30 essay")
        elif "loop" in msg_lower or "verna" in msg_lower or "growth" in msg_lower:
            suggestions.append("How do B2B growth loops differ from traditional funnels?")
            suggestions.append("What does Elena Verna say about product-led sales triggers?")
            suggestions.append("Create a Ship 30 for 30 essay on growth loops")
        elif top_guest and top_guest != "Unknown":
            suggestions.append(f"What other tactical frameworks did {top_guest} share?")
            suggestions.append(f"Turn this advice from {top_guest} into a Ship 30 essay")
            suggestions.append("How can a growth PM execute this in 24 hours?")
        else:
            suggestions.append("Can you provide a step-by-step checklist for this?")
            suggestions.append("Turn this insight into a Ship 30 for 30 essay")

        return suggestions[:3]

    _ATTR_RE = re.compile(
        r"([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s}'\"]+))"
    )

    def _parse_artifacts(self, text: str, session_id: str) -> List[ArtifactItem]:
        """Parse :::artifact blocks from model output.

        Tolerates the three shapes small LLMs actually produce:
          1. :::artifact{id="x" type="markdown" title="T"}        (all attrs braced)
          2. :::artifact type="markdown" title="T"                (bare attrs)
          3. :::artifact{id="x"} type="markdown" title="T"        (MIXED — braced + bare)

        Attributes are read token-by-token from the opening line, so attrs
        after a closing brace (shape 3) are no longer dropped. The body runs
        from the first non-attribute text to the first closing ':::' (or end
        of input). Model-supplied ids are always regenerated (PK safety).
        """
        artifacts = []
        for m in re.finditer(r':::artifact\b', text):
            pos = m.end()
            line_end = text.find('\n', pos)
            window = text[pos:line_end] if line_end != -1 else text[pos:]

            attrs: Dict[str, str] = {}
            cursor = 0
            while cursor < len(window):
                # Skip whitespace and stray brace delimiters.
                while cursor < len(window) and (window[cursor].isspace() or window[cursor] in '{}'):
                    cursor += 1
                am = self._ATTR_RE.match(window, cursor)
                if not am:
                    break
                value = am.group(2) if am.group(2) is not None else (
                    am.group(3) if am.group(3) is not None else am.group(4)
                )
                attrs[am.group(1)] = value
                cursor = am.end()

            # Body starts at the cursor: remainder of the opening line (if any)
            # or the next line.
            body_start = pos + cursor
            if body_start < len(text) and text[body_start] == '\n':
                body_start += 1
            rest = text[body_start:]
            close = rest.find(':::')
            content = (rest if close == -1 else rest[:close])

            # Clean stray leading colons and trailing dots/colons/whitespace.
            content = re.sub(r'^[:\s]+', '', content).strip()
            content = re.sub(r'(?:::|[.\s])+$', '', content).strip()
            if not content:
                continue

            art_type = attrs.get("type", "markdown").lower()
            if art_type not in ["markdown", "html"]:
                art_type = "markdown"
            title = attrs.get("title", "Growth Artifact").strip()

            if art_type == "html":
                # Verify that content actually contains HTML tags
                has_html_tags = bool(re.search(r'<!DOCTYPE|<html|<head|<body|<div|<main|<section|<table|<form|<p\b|<h[1-6]\b', content, re.IGNORECASE))
                if not has_html_tags:
                    art_type = "markdown"
                else:
                    # Strip stray leading characters before first valid HTML tag (e.g. ')}', '```html')
                    first_tag = re.search(r'<!DOCTYPE|<html|<head|<body|<div|<main|<section|<header', content, re.IGNORECASE)
                    if first_tag and first_tag.start() > 0:
                        content = content[first_tag.start():].strip()

                    # If </html> exists, truncate any trailing commentary or markdown that leaked into the block
                    html_end = content.rfind('</html>')
                    if html_end != -1:
                        content = content[:html_end + 7].strip()
                    else:
                        # If </html> was missing, strip any trailing markdown explanation headers
                        md_leak = re.search(r'\n```|\n###\s+Explanation|\n###\s+How\s+to|\n###\s+Example', content)
                        if md_leak and md_leak.start() > 50:
                            content = content[:md_leak.start()].strip()
                            if not content.endswith('</html>'):
                                content += '\n</body></html>'

            # Filter out model hallucinations leaking system prompt instructions
            if "Presentation & Formatting Standards" in content or "Core Operating Rules" in content or "Grounding & Evidence" in content:
                continue

            # NOTE: model-supplied ids are intentionally IGNORED. A 1B model
            # frequently repeats the same id (e.g. the constant "essay" in the
            # ship30 prompt) which would violate the primary key and silently
            # lose the assistant message + artifact on commit.
            artifacts.append(ArtifactItem(
                id=str(uuid.uuid4()),
                session_id=session_id,
                artifact_type=art_type,
                title=title,
                content=content,
                version=1
            ))
        return artifacts

agent_service = AgentService()
