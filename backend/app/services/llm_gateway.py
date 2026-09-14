import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat_schemas import ModelStatus

SUPPORTED_PROVIDERS = {"ollama", "groq", "openai", "anthropic"}

DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class LLMProviderError(Exception):
    """Structured provider failure surfaced to the agent as an SSE 'error' event.

    The message is safe to show to end users; the optional detail field holds
    technical context that is only written to the backend logs.
    """

    def __init__(self, message: str, provider: str = "unknown", detail: str = ""):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.detail = detail


class LLMGateway:
    """Unified LLM Gateway for Local Ollama, Cloud Groq, Anthropic, OpenAI, and Custom Models."""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=90.0)
        self.custom_models: Dict[str, Dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Model registration & discovery
    # ------------------------------------------------------------------
    def register_custom_model(
        self,
        provider: str,
        model_name: str,
        api_key: str,
        base_url: Optional[str] = None
    ) -> ModelStatus:
        provider_clean = provider.strip().lower()
        model_clean = model_name.strip()
        key = f"{provider_clean}:{model_clean}"

        if not base_url or not base_url.strip():
            if provider_clean == "groq":
                base_url = settings.GROQ_BASE_URL
            elif provider_clean == "openai":
                base_url = "https://api.openai.com/v1"
            elif provider_clean == "anthropic":
                base_url = "https://api.anthropic.com/v1"
            else:
                base_url = "https://api.openai.com/v1"

        if not base_url.startswith(("http://", "https://")):
            raise LLMProviderError("Base URL must start with http:// or https://", provider=provider_clean)

        self.custom_models[key] = {
            "provider": provider_clean,
            "model_name": model_clean,
            "api_key": api_key.strip(),
            "base_url": base_url.strip().rstrip("/"),
        }

        # Reflect the key back into settings so health checks report availability.
        if provider_clean == "groq":
            settings.GROQ_API_KEY = api_key.strip()
            settings.DEFAULT_GROQ_MODEL = model_clean
        elif provider_clean == "anthropic":
            settings.ANTHROPIC_API_KEY = api_key.strip()
        elif provider_clean == "openai":
            settings.OPENAI_API_KEY = api_key.strip()

        return ModelStatus(
            provider=provider_clean,
            model_name=model_clean,
            available=True,
            is_local=False,
            details=f"Custom {provider_clean.upper()} model active"
        )

    async def get_available_models(self) -> List[ModelStatus]:
        models = []

        # 1. Local Ollama (always listed so the UI can show its state)
        models.append(await self._check_ollama_status())

        # 2. Cloud Groq - only if a key is configured
        if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
            models.append(self._check_groq_status())

        # 3. Anthropic - only if a key is configured
        if settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 5:
            models.append(ModelStatus(
                provider="anthropic",
                model_name=DEFAULT_ANTHROPIC_MODEL,
                available=True,
                is_local=False,
                details="Configured"
            ))

        # 4. OpenAI - only if a key is configured
        if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5:
            models.append(ModelStatus(
                provider="openai",
                model_name=DEFAULT_OPENAI_MODEL,
                available=True,
                is_local=False,
                details="Configured"
            ))

        # 5. Custom registered models
        for cm in self.custom_models.values():
            if cm["provider"] == "groq" and settings.GROQ_API_KEY and cm["model_name"] == settings.DEFAULT_GROQ_MODEL:
                continue
            models.append(ModelStatus(
                provider=cm["provider"],
                model_name=cm["model_name"],
                available=True,
                is_local=False,
                details=f"Connected ({cm['provider'].upper()})"
            ))

        return models

    async def _check_ollama_status(self, target_model: Optional[str] = None) -> ModelStatus:
        target = target_model or settings.DEFAULT_LOCAL_MODEL
        try:
            resp = await self.client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2.5)
            if resp.status_code == 200:
                tags = resp.json().get("models", [])
                model_names = [m.get("name") for m in tags]

                if target in model_names:
                    return ModelStatus(
                        provider="ollama",
                        model_name=target,
                        available=True,
                        is_local=True,
                        details=f"Ollama online with {len(model_names)} installed model(s)"
                    )
                if model_names:
                    return ModelStatus(
                        provider="ollama",
                        model_name=model_names[0],
                        available=True,
                        is_local=True,
                        details=(
                            f"Ollama online; '{target}' not installed. "
                            f"Using '{model_names[0]}' instead."
                        )
                    )
                return ModelStatus(
                    provider="ollama",
                    model_name=target,
                    available=False,
                    is_local=True,
                    details="Ollama online but no models installed. Run: ollama pull " + target
                )
        except Exception as e:
            return ModelStatus(
                provider="ollama",
                model_name=target,
                available=False,
                is_local=True,
                details=f"Ollama unreachable at {settings.OLLAMA_BASE_URL}: {type(e).__name__}"
            )

        return ModelStatus(
            provider="ollama",
            model_name=target,
            available=False,
            is_local=True,
            details="Ollama responded with non-200 status"
        )

    def _check_groq_status(self) -> ModelStatus:
        has_key = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5)
        return ModelStatus(
            provider="groq",
            model_name=settings.DEFAULT_GROQ_MODEL,
            available=has_key,
            is_local=False,
            details="Groq API key active" if has_key else "Provide GROQ_API_KEY in .env or UI"
        )

    # ------------------------------------------------------------------
    # Preflight validation (clear failures before any token is streamed)
    # ------------------------------------------------------------------
    def _resolve_runtime(self, provider: Optional[str], model: Optional[str]):
        provider = (provider or settings.ACTIVE_PROVIDER or "ollama").lower()
        custom_info = self.custom_models.get(f"{provider}:{model}")
        if custom_info is None and provider not in SUPPORTED_PROVIDERS:
            # A registered custom provider may be selected by provider alone;
            # resolve to any model registered under it.
            custom_info = next(
                (v for v in self.custom_models.values() if v["provider"] == provider),
                None,
            )
        if provider not in SUPPORTED_PROVIDERS and custom_info is None:
            raise LLMProviderError(
                f"Unsupported provider '{provider}'. Supported: {', '.join(sorted(SUPPORTED_PROVIDERS))}.",
                provider=provider,
            )

        if provider == "ollama":
            resolved_model = model or settings.DEFAULT_LOCAL_MODEL
            api_key = None
            base_url = settings.OLLAMA_BASE_URL
        elif provider == "anthropic":
            resolved_model = model or (custom_info["model_name"] if custom_info else DEFAULT_ANTHROPIC_MODEL)
            api_key = custom_info["api_key"] if custom_info else settings.ANTHROPIC_API_KEY
            base_url = custom_info["base_url"] if custom_info else "https://api.anthropic.com/v1"
        elif provider == "groq":
            resolved_model = model or (custom_info["model_name"] if custom_info else settings.DEFAULT_GROQ_MODEL)
            api_key = custom_info["api_key"] if custom_info else settings.GROQ_API_KEY
            base_url = custom_info["base_url"] if custom_info else settings.GROQ_BASE_URL
        else:  # openai or unknown-but-registered custom provider
            resolved_model = model or (custom_info["model_name"] if custom_info else DEFAULT_OPENAI_MODEL)
            api_key = custom_info["api_key"] if custom_info else settings.OPENAI_API_KEY
            base_url = custom_info["base_url"] if custom_info else "https://api.openai.com/v1"

        if provider != "ollama" and (not api_key or len(str(api_key).strip()) <= 5):
            raise LLMProviderError(
                f"No API key configured for {provider}. Add it via the 'Add Model' dialog or set it in .env.",
                provider=provider,
            )

        return provider, resolved_model, api_key, base_url

    async def validate_provider(self, provider: Optional[str] = None, model: Optional[str] = None) -> None:
        """Raise LLMProviderError with a user-safe message if the provider cannot serve a request."""
        provider, resolved_model, _api_key, base_url = self._resolve_runtime(provider, model)
        if provider == "ollama":
            status = await self._check_ollama_status(resolved_model)
            if not status.available:
                raise LLMProviderError(
                    f"Ollama is not reachable at {settings.OLLAMA_BASE_URL} or has no models installed. "
                    "Start it with 'ollama serve' or switch to a cloud provider.",
                    provider="ollama",
                    detail=status.details,
                )
            if status.model_name != resolved_model:
                # The requested model isn't installed; stream_chat resolves the
                # actual runtime model via _check_ollama_status, so this is a
                # notice rather than a failure.
                logger.warning(
                    f"Requested Ollama model '{resolved_model}' is not installed; "
                    f"'{status.model_name}' will be used instead."
                )

    # ------------------------------------------------------------------
    # Streaming
    # ------------------------------------------------------------------
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.5
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from the requested provider.

        Raises LLMProviderError on connection/timeout/config failures so the
        agent can emit a structured error event instead of corrupting the chat
        stream with inline error text.
        """
        provider, resolved_model, api_key, base_url = self._resolve_runtime(provider, model)

        if provider == "anthropic":
            async for token in self._stream_anthropic(
                messages, resolved_model, temperature, api_key=api_key, base_url=base_url
            ):
                yield token
        elif provider == "ollama":
            # Honest fallback: if the requested local model isn't installed,
            # stream from the first model Ollama actually has (the UI model
            # menu already lists it). Never 404 mid-stream because of this.
            status = await self._check_ollama_status(resolved_model)
            if not status.available:
                raise LLMProviderError(
                    f"Ollama is not reachable at {settings.OLLAMA_BASE_URL} or has no models installed. "
                    "Start it with 'ollama serve' or switch to a cloud provider.",
                    provider="ollama",
                    detail=status.details,
                )
            if status.model_name != resolved_model:
                logger.warning(
                    f"Ollama model '{resolved_model}' is not installed; falling back to '{status.model_name}'."
                )
            async for token in self._stream_ollama(messages, status.model_name, temperature):
                yield token
        else:
            async for token in self._stream_openai_compatible(
                messages=messages,
                model=resolved_model,
                temperature=temperature,
                api_key=api_key,
                base_url=base_url,
                provider_name=provider.upper()
            ):
                yield token

    async def _stream_ollama(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float
    ) -> AsyncGenerator[str, None]:
        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": 2500,
                "repeat_penalty": 1.15,
                "stop": ["</html>", ":::", "\n\nUser Question:", "\n\nUser:"]
            }
        }
        try:
            async with self.client.stream("POST", url, json=payload, timeout=180.0) as resp:
                if resp.status_code != 200:
                    err_text = await resp.aread()
                    err_msg = err_text.decode('utf-8', errors='replace')
                    try:
                        err_json = json.loads(err_msg)
                        err_msg = err_json.get("error", err_msg)
                    except Exception:
                        pass
                    if "not found" in err_msg.lower() or "not exist" in err_msg.lower():
                        raise LLMProviderError(
                            f"Ollama model '{model}' is not installed. Run: ollama pull {model}",
                            provider="ollama",
                            detail=err_msg,
                        )
                    raise LLMProviderError(
                        f"Ollama rejected the request (HTTP {resp.status_code}).",
                        provider="ollama",
                        detail=err_msg,
                    )

                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if data.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
        except httpx.ConnectError as e:
            raise LLMProviderError(
                f"Could not connect to Ollama at {settings.OLLAMA_BASE_URL}. Ensure 'ollama serve' is running.",
                provider="ollama",
                detail=str(e),
            ) from e
        except httpx.TimeoutException as e:
            raise LLMProviderError(
                "Ollama inference timed out. Try a more specific question or switch to a cloud provider.",
                provider="ollama",
                detail=str(e),
            ) from e
        except LLMProviderError:
            raise
        except Exception as e:
            raise LLMProviderError(
                f"Ollama inference failed: {type(e).__name__}.",
                provider="ollama",
                detail=str(e),
            ) from e

    async def _stream_openai_compatible(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        api_key: Optional[str],
        base_url: str,
        provider_name: str = "API"
    ) -> AsyncGenerator[str, None]:
        endpoint = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        # Groq on-demand tier caps qwen models at 1,000 output tokens per minute (OTPM).
        # Requesting 4096 triggers instant HTTP 429 rejection before generation starts.
        max_tokens = 4096
        if provider_name.upper() == "GROQ" and "qwen" in model.lower():
            max_tokens = 950

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        try:
            async with self.client.stream("POST", endpoint, headers=headers, json=payload, timeout=90.0) as resp:
                if resp.status_code != 200:
                    err_text = await resp.aread()
                    err_msg = err_text.decode('utf-8', errors='replace')
                    try:
                        err_json = json.loads(err_msg)
                        err_msg = err_json.get("error", {}).get("message", err_msg)
                    except Exception:
                        pass
                    if resp.status_code in (401, 403):
                        raise LLMProviderError(
                            f"{provider_name} rejected the API key (HTTP {resp.status_code}). Check your credentials.",
                            provider=provider_name.lower(),
                            detail=err_msg,
                        )
                    if resp.status_code == 429:
                        raise LLMProviderError(
                            f"{provider_name} rate limit reached (HTTP 429).",
                            provider=provider_name.lower(),
                            detail=err_msg,
                        )
                    raise LLMProviderError(
                        f"{provider_name} API error (HTTP {resp.status_code}).",
                        provider=provider_name.lower(),
                        detail=err_msg,
                    )

                async for line in resp.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, IndexError, KeyError):
                        continue
        except httpx.ConnectError as e:
            raise LLMProviderError(
                f"Could not connect to {provider_name}. Check your network connection.",
                provider=provider_name.lower(),
                detail=str(e),
            ) from e
        except httpx.TimeoutException as e:
            raise LLMProviderError(
                f"{provider_name} request timed out after 90 seconds. Please try again.",
                provider=provider_name.lower(),
                detail=str(e),
            ) from e
        except LLMProviderError:
            raise
        except Exception as e:
            raise LLMProviderError(
                f"{provider_name} streaming failed: {type(e).__name__}.",
                provider=provider_name.lower(),
                detail=str(e),
            ) from e

    async def _stream_anthropic(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        system_content = "You are The Lenny Growth Assistant, grounded strictly in Lenny's Podcast transcripts."
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_content = m["content"]
            else:
                chat_msgs.append({"role": m["role"], "content": m["content"]})

        try:
            from anthropic import AsyncAnthropic
            # Explicit request timeout: the brief's resilience bar includes
            # model timeouts; without this the SDK default (10 min) would
            # leave the stream hanging far past the gateway's 90s budget.
            anthropic_client = AsyncAnthropic(api_key=api_key, base_url=base_url, timeout=90.0)
            async with anthropic_client.messages.stream(
                max_tokens=4096,
                messages=chat_msgs,
                model=model,
                system=system_content,
                temperature=temperature,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except LLMProviderError:
            raise
        except Exception as e:
            raise LLMProviderError(
                f"Anthropic request failed: {type(e).__name__}.",
                provider="anthropic",
                detail=str(e),
            ) from e

    async def aclose(self):
        try:
            if hasattr(self, "client") and not self.client.is_closed:
                await self.client.aclose()
        except Exception:
            pass


llm_gateway = LLMGateway()
