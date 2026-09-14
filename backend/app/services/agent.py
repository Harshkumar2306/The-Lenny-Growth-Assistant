import re
import json
import uuid
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.services.rag_engine import rag_engine
from app.services.llm_gateway import llm_gateway, LLMProviderError
from app.services.ship30_skill import SHIP30_SYSTEM_PROMPT, build_ship30_prompt
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

3. ARTIFACT GENERATION:
   - When the user asks for a reusable deliverable (such as a PRD template, strategy framework, complete HTML/CSS prototype, interactive calculator, or Ship 30 essay), encapsulate it cleanly in an artifact block:
     :::artifact{id="artifact-uuid" type="markdown" title="Descriptive Title"}
     ...formatted markdown content...
     :::
     or for interactive widgets/prototypes:
     :::artifact{id="artifact-uuid" type="html" title="Interactive PMF Calculator"}
     <!DOCTYPE html>
     ...complete self-contained HTML with CSS & JS...
     :::

4. PRESENTATION & FORMATTING STANDARDS:
   - Always structure your response using clear Markdown headings (e.g. `### Core Framework`, `### Tactical Takeaways`).
   - Use bullet points (`- `) with **bold lead-ins** for every actionable insight (e.g. `- **Point Name**: Explanation...`).
   - When presenting comparative analysis, competitor breakdowns, or features, ALWAYS format them as clean Markdown tables:
     | Dimension / Feature | Option A | Option B |
     | :--- | :--- | :--- |
   - Never output flat unformatted text. Separate distinct concepts with clean double-spacing.
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

        The explicit UI skill selection is authoritative; text heuristics only
        apply when the user is in the default chat mode, and they use
        word-boundary matching to avoid substring false positives.
        """
        msg_lower = message.lower()

        if skill == "ship30":
            return {"ship30": True, "html": False}
        if skill == "artifact":
            return {"ship30": False, "html": True}

        is_ship30 = bool(re.search(r'\bship\s*30\b', msg_lower))
        is_html = bool(
            re.search(r'\bhtml\b|\bcss\b|\bprototype\b|\bwidget\b|\bcalculator\b|\bdashboard\b|\binteractive\b', msg_lower)
        )
        # A ship30 ask inside chat mode never doubles as an HTML request.
        if is_ship30:
            is_html = False
        return {"ship30": is_ship30, "html": is_html}

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
        context_str = ""
        for i, c in enumerate(chunks):
            context_str += f"\n--- Source {i+1}: {c['guest']} - \"{c['title']}\" (Timestamp: {c['timestamp']}) ---\n"
            context_str += f"{c['text']}\n"

        if is_ship30:
            system_prompt = SHIP30_SYSTEM_PROMPT
            user_prompt = build_ship30_prompt(message, chunks)
        elif is_html_artifact:
            system_prompt = BASE_SYSTEM_PROMPT
            user_prompt = (
                f"User request: {message}\n\n"
                f"Podcast Evidence:\n{context_str}\n\n"
                f"Generate a complete, beautiful, modern HTML/CSS/JS interactive artifact grounded in this knowledge. "
                f"Encapsulate the HTML strictly in:\n"
                f":::artifact{{id=\"{str(uuid.uuid4())[:8]}\" type=\"html\" title=\"{message[:40]}\"}}\n"
                f"<!DOCTYPE html><html><head><script src=\"https://cdn.tailwindcss.com\"></script></head><body class=\"p-6 bg-slate-50 font-sans\">...</body></html>\n:::\n"
                f"Also provide a brief conversational explanation before or after the artifact."
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
                f"5. If a reusable guide, checklist, or template is requested, encapsulate it in:\n"
                f":::artifact{{id=\"{str(uuid.uuid4())[:8]}\" type=\"markdown\" title=\"...\"}}\n...\n:::"
            )

        # Build messages payload
        messages = [{"role": "system", "content": system_prompt}]
        # Include recent 4 history messages for conversational context
        for h in history[-4:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": user_prompt})

        # Step 4: Stream response and detect artifacts
        full_content = ""
        try:
            async for token in llm_gateway.stream_chat(messages, provider=provider, model=model):
                full_content += token
                yield {"type": "token", "data": token}
        except LLMProviderError as e:
            logger.error(
                f"LLM provider failure mid-stream ({e.provider})",
                extra={"provider": e.provider, "detail": e.detail},
            )
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
                    "suggestions": ["Switch to Ollama and retry", "Check the model configuration in the header"]
                }
            }
            return

        # Step 5: Parse artifacts from generated content
        artifacts = self._parse_artifacts(full_content, session_id)

        # Resilient fallback: auto-package artifact if requested but model forgot delimiter tags
        if not artifacts:
            if is_ship30 and len(full_content) > 120:
                title_match = re.search(r'^#\s+(.+)$', full_content, re.MULTILINE)
                essay_title = title_match.group(1).strip() if title_match else f"Ship 30 Essay: {message[:40]}"
                artifacts.append(ArtifactItem(
                    id=str(uuid.uuid4()),
                    session_id=session_id,
                    artifact_type="markdown",
                    title=essay_title,
                    content=full_content,
                    version=1
                ))
            elif is_html_artifact and ("<!DOCTYPE html>" in full_content or "<html" in full_content or "```html" in full_content):
                html_code = full_content
                html_block = re.search(r'```html\s*(.*?)\s*```', full_content, re.DOTALL)
                if html_block:
                    html_code = html_block.group(1)
                elif "<!DOCTYPE html>" in full_content:
                    start_idx = full_content.find("<!DOCTYPE html>")
                    end_idx = full_content.find("</html>", start_idx)
                    if end_idx != -1:
                        html_code = full_content[start_idx:end_idx + 7]
                    else:
                        html_code = full_content[start_idx:]

                artifacts.append(ArtifactItem(
                    id=str(uuid.uuid4()),
                    session_id=session_id,
                    artifact_type="html",
                    title=f"Interactive Prototype: {message[:30]}",
                    content=html_code,
                    version=1
                ))

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
