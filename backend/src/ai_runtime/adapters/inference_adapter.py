"""Inference adapters: protocol + FireworksAdapter + OpenAIAdapter + LocalAdapter + MockAdapter.

Architecture:
    Switching providers requires ONLY an env var change (INFERENCE_PROVIDER).
    No code changes needed. The factory function ``get_inference_adapter()``
    returns the correct adapter based on settings.

AMD Story:
    FireworksAdapter points at Fireworks AI which runs Gemma 4 31B IT on AMD Instinct MI300X GPUs.
    The client is a standard OpenAI-compatible AsyncOpenAI client with a different base_url.
    Model: accounts/fireworks/models/gemma-4-31b-it (April 2026 release, optimised for MI300X).
    Switching from mock → fireworks requires zero code changes — only an env var update.
"""
from __future__ import annotations

import logging
import random
import time
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)


# ── Protocol ──────────────────────────────────────────────────────────────────

@runtime_checkable
class InferenceAdapter(Protocol):
    """Protocol that all inference adapters must satisfy."""

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Generate a chat completion.

        Args:
            messages: OpenAI-style messages list [{"role": ..., "content": ...}].
            temperature: Sampling temperature (0.0 to 2.0).
            max_tokens: Maximum output tokens.
            **kwargs: Provider-specific overrides.

        Returns:
            Completion text string.
        """
        ...

    def get_model_name(self) -> str:
        """Return the model identifier string."""
        ...


# ── FireworksAdapter ──────────────────────────────────────────────────────────

class FireworksAdapter:
    """Inference via Fireworks AI (Gemma 4 31B IT on AMD Instinct MI300X).

    Routes requests to ``accounts/fireworks/models/gemma-4-31b-it`` via the
    Fireworks AI inference endpoint. Gemma 4 31B IT runs on AMD Instinct MI300X
    GPUs in Fireworks' data centre, providing state-of-the-art reasoning quality
    for evidence analysis and hypothesis generation.

    Uses the OpenAI-compatible client with Fireworks base URL.
    Provider independence is maintained — switching from mock to fireworks
    requires only setting INFERENCE_PROVIDER=fireworks in .env.
    """

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # noqa: PLC0415
        from src.shared.config import settings  # noqa: PLC0415

        self._model = settings.FIREWORKS_MODEL
        self._client = AsyncOpenAI(
            api_key=settings.FIREWORKS_API_KEY,
            base_url=settings.FIREWORKS_BASE_URL,
        )

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Call Fireworks AI for inference with model fallback sequence."""
        import openai  # noqa: PLC0415
        
        # Strictly prioritize the allowlisted hackathon models
        models_to_try = [
            "accounts/fireworks/models/gemma-4-31b-it",
            "accounts/fireworks/models/gemma-3-27b-it",
            "accounts/fireworks/models/deepseek-v4-pro"
        ]
        if self._model and self._model not in models_to_try:
            models_to_try.insert(0, self._model)

        last_error = None
        for model in models_to_try:
            try:
                logger.info("Attempting Fireworks AI inference with model: %s", model)
                response = await self._client.chat.completions.create(
                    model=model,
                    messages=messages,  # type: ignore[arg-type]
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs,
                )
                content = response.choices[0].message.content
                # Update the model string so get_model_name reports the successful model
                self._model = model
                return content or ""
            except (openai.NotFoundError, openai.APIStatusError) as exc:
                status_code = getattr(exc, "status_code", None)
                if status_code == 404 or "not found" in str(exc).lower() or "inaccessible" in str(exc).lower():
                    logger.warning("Model %s not found or inaccessible (404/APIStatusError). Trying fallback...", model)
                    last_error = exc
                    continue
                raise exc
            except Exception as exc:
                if "not found" in str(exc).lower() or "not deployed" in str(exc).lower() or "inaccessible" in str(exc).lower() or "404" in str(exc):
                    logger.warning("Model %s failed with exception: %s. Trying fallback...", model, exc)
                    last_error = exc
                    continue
                raise exc

        if last_error:
            raise last_error
        raise RuntimeError("No models available to execute inference")

    def get_model_name(self) -> str:
        return self._model


# ── OpenAIAdapter ─────────────────────────────────────────────────────────────

class OpenAIAdapter:
    """Inference via OpenAI API (GPT-4o-mini by default)."""

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # noqa: PLC0415
        from src.shared.config import settings  # noqa: PLC0415

        self._model = settings.OPENAI_MODEL
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Call OpenAI for inference."""
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        content = response.choices[0].message.content
        return content or ""

    def get_model_name(self) -> str:
        return self._model


# ── LocalAdapter ──────────────────────────────────────────────────────────────

class LocalAdapter:
    """Inference via local Ollama server (OpenAI-compatible)."""

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # noqa: PLC0415
        from src.shared.config import settings  # noqa: PLC0415

        self._model = settings.LOCAL_MODEL
        self._client = AsyncOpenAI(
            api_key="ollama",  # Ollama doesn't need a real key
            base_url=settings.LOCAL_OLLAMA_URL,
        )

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Call local Ollama for inference."""
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        content = response.choices[0].message.content
        return content or ""

    def get_model_name(self) -> str:
        return self._model


# ── MockAdapter ───────────────────────────────────────────────────────────────

class MockAdapter:
    """Deterministic mock adapter for testing — no external calls."""

    MODEL_NAME = "mock-gpt-0"

    # Templates for deterministic test output
    _RESPONSES: dict[str, str] = {
        "hypothesis": (
            "## Hypothesis: Root Cause Analysis\n\n"
            "Based on the evidence provided, the most likely root cause is a process deviation "
            "in the upstream supply chain, specifically related to temperature excursions during "
            "transport. Evidence citation [1] supports this with sensor data showing 4°C above "
            "the specification limit for 3 hours.\n\n"
            "Confidence: 0.82\n"
        ),
        "capa": (
            "## Corrective and Preventive Action Plan\n\n"
            "**Corrective Actions:**\n"
            "1. Quarantine affected batch #B2024-001\n"
            "2. Initiate supplier audit for cold-chain compliance\n"
            "3. Review receiving inspection protocol\n\n"
            "**Preventive Actions:**\n"
            "1. Install continuous temperature monitoring on all inbound shipments\n"
            "2. Update supplier qualification criteria to require real-time telemetry\n"
            "3. Retrain logistics team on cold-chain requirements\n"
        ),
        "summary": (
            "## Investigation Summary\n\n"
            "This investigation examined a quality deviation reported on 2024-01-15. "
            "Three evidence files were analyzed. The primary finding points to a process "
            "gap in incoming inspection procedures. Two hypotheses were generated and "
            "reviewed by the team.\n"
        ),
        "default": (
            "This is a mock response from the Helix AI Runtime. "
            "In production, this would be replaced by a real LLM response from "
            "the configured inference provider.\n"
        ),
    }

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs,
    ) -> str:
        """Return deterministic mock response based on message content keywords."""
        # Small delay to simulate network latency in tests
        import asyncio  # noqa: PLC0415
        await asyncio.sleep(0.01)

        # Determine response type from last user message
        last_content = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_content = (msg.get("content") or "").lower()
                break

        if "hypothesis" in last_content or "root cause" in last_content:
            return self._RESPONSES["hypothesis"]
        elif "capa" in last_content or "corrective" in last_content:
            return self._RESPONSES["capa"]
        elif "summary" in last_content or "summarize" in last_content:
            return self._RESPONSES["summary"]
        else:
            return self._RESPONSES["default"]

    def get_model_name(self) -> str:
        return self.MODEL_NAME


# ── Factory ───────────────────────────────────────────────────────────────────

_adapter_cache: dict[str, InferenceAdapter] = {}


def get_inference_adapter(provider: str | None = None) -> InferenceAdapter:
    """Return the configured inference adapter (cached by provider).

    Selection is driven by the INFERENCE_PROVIDER environment variable if not specified:
        - ``fireworks``: Fireworks AI — Gemma 4 31B IT on AMD Instinct MI300X (preferred demo)
        - ``openai``: OpenAI GPT-4o-mini
        - ``local``: Ollama local server
        - ``mock``: Deterministic mock for testing

    Returns:
        Configured InferenceAdapter instance.

    Raises:
        ValueError: Unknown provider.
    """
    global _adapter_cache
    from src.shared.config import settings  # noqa: PLC0415

    if provider is None:
        provider = settings.INFERENCE_PROVIDER

    if provider in _adapter_cache:
        return _adapter_cache[provider]

    logger.info("Initializing inference adapter: provider=%s", provider)

    if provider == "fireworks":
        adapter = FireworksAdapter()
    elif provider == "openai":
        adapter = OpenAIAdapter()
    elif provider == "local":
        adapter = LocalAdapter()
    elif provider == "mock":
        adapter = MockAdapter()
    else:
        raise ValueError(f"Unknown INFERENCE_PROVIDER: '{provider}'")

    _adapter_cache[provider] = adapter
    return adapter


def reset_adapter_cache() -> None:
    """Reset the adapter cache — used in tests to swap providers."""
    global _adapter_cache
    _adapter_cache.clear()
