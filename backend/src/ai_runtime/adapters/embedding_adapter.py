"""Embedding adapters: Protocol + LocalEmbeddingAdapter + FireworksEmbeddingAdapter.

Embedding generation is the foundation for semantic search. This module provides
pluggable adapters so the embedding provider can be swapped via config.

Local (dev): sentence-transformers all-MiniLM-L6-v2 → 384 dimensions
Fireworks (prod): nomic-ai/nomic-embed-text-v1.5 → 768 dimensions (set EMBEDDING_DIM=768)
"""
from __future__ import annotations

import logging
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)


# ── Protocol ──────────────────────────────────────────────────────────────────

@runtime_checkable
class EmbeddingAdapter(Protocol):
    """Protocol that all embedding adapters must satisfy."""

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts.

        Args:
            texts: List of text strings to embed.

        Returns:
            List of float vectors (one per text). All vectors have the same
            dimensionality (determined by the underlying model).
        """
        ...

    def get_model_name(self) -> str:
        """Return the embedding model identifier."""
        ...

    def get_dimensions(self) -> int:
        """Return the vector dimensionality."""
        ...


# ── LocalEmbeddingAdapter ─────────────────────────────────────────────────────

class LocalEmbeddingAdapter:
    """Embedding generation using sentence-transformers (all-MiniLM-L6-v2).

    Runs entirely locally — no API key required. Suitable for development
    and air-gapped deployments.

    Model: all-MiniLM-L6-v2
    Dimensions: 384
    """

    _model = None  # Lazy-loaded to avoid slow import at startup

    def __init__(self) -> None:
        from src.shared.config import settings  # noqa: PLC0415
        self._model_name = settings.EMBEDDING_MODEL_LOCAL

    def _load_model(self):
        """Lazy-load the sentence transformer model."""
        if LocalEmbeddingAdapter._model is None:
            from sentence_transformers import SentenceTransformer  # noqa: PLC0415
            logger.info("Loading sentence-transformer model: %s", self._model_name)
            LocalEmbeddingAdapter._model = SentenceTransformer(self._model_name)
        return LocalEmbeddingAdapter._model

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings using sentence-transformers.

        Runs in an executor to avoid blocking the event loop since
        sentence-transformers inference is synchronous.

        Args:
            texts: List of texts to embed.

        Returns:
            List of 384-dimensional float vectors.
        """
        import asyncio  # noqa: PLC0415

        loop = asyncio.get_event_loop()

        def _encode() -> list[list[float]]:
            model = self._load_model()
            embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return embeddings.tolist()

        result = await loop.run_in_executor(None, _encode)
        logger.debug("LocalEmbeddingAdapter: embedded %d texts → %d dims", len(texts), len(result[0]) if result else 0)
        return result

    def get_model_name(self) -> str:
        return self._model_name

    def get_dimensions(self) -> int:
        return 384


# ── FireworksEmbeddingAdapter ─────────────────────────────────────────────────

class FireworksEmbeddingAdapter:
    """Embedding generation via Fireworks AI embedding endpoint.

    Model: nomic-ai/nomic-embed-text-v1.5
    Dimensions: 768
    """

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # noqa: PLC0415
        from src.shared.config import settings  # noqa: PLC0415

        self._model_name = settings.EMBEDDING_MODEL_FIREWORKS
        self._client = AsyncOpenAI(
            api_key=settings.FIREWORKS_API_KEY,
            base_url=settings.FIREWORKS_BASE_URL,
        )

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Call Fireworks embedding endpoint.

        Args:
            texts: List of texts to embed (will be batched).

        Returns:
            List of 768-dimensional float vectors.
        """
        if not texts:
            return []

        # Fireworks may have batch size limits — chunk if needed
        batch_size = 64
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._client.embeddings.create(
                model=self._model_name,
                input=batch,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        logger.debug(
            "FireworksEmbeddingAdapter: embedded %d texts via %s",
            len(texts),
            self._model_name,
        )
        return all_embeddings

    def get_model_name(self) -> str:
        return self._model_name

    def get_dimensions(self) -> int:
        return 768


# ── MockEmbeddingAdapter ──────────────────────────────────────────────────────

class MockEmbeddingAdapter:
    """Deterministic mock embedding adapter for tests.

    Generates reproducible pseudo-embeddings based on text hash.
    """

    def __init__(self) -> None:
        from src.shared.config import settings  # noqa: PLC0415
        self._dims = settings.EMBEDDING_DIM

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate deterministic pseudo-embeddings for testing."""
        import hashlib  # noqa: PLC0415
        result = []
        for text in texts:
            # Create a deterministic but varied vector from text hash
            h = hashlib.md5(text.encode()).digest()
            base = [((b / 255.0) - 0.5) * 2 for b in h]  # 16 floats in [-1, 1]
            # Tile to fill required dimensions
            vec = (base * (self._dims // 16 + 1))[: self._dims]
            # Normalize
            norm = sum(v**2 for v in vec) ** 0.5 or 1.0
            vec = [v / norm for v in vec]
            result.append(vec)
        return result

    def get_model_name(self) -> str:
        return "mock-embed-v1"

    def get_dimensions(self) -> int:
        from src.shared.config import settings  # noqa: PLC0415
        return settings.EMBEDDING_DIM


# ── Factory ───────────────────────────────────────────────────────────────────

_embedding_adapter_cache: EmbeddingAdapter | None = None


def get_embedding_adapter() -> EmbeddingAdapter:
    """Return the configured embedding adapter (cached singleton).

    Selection driven by EMBEDDING_PROVIDER env var:
        - ``local``: sentence-transformers all-MiniLM-L6-v2 (384 dims)
        - ``fireworks``: nomic-embed-text-v1.5 via Fireworks AI (768 dims)

    Returns:
        Configured EmbeddingAdapter instance.
    """
    global _embedding_adapter_cache
    if _embedding_adapter_cache is not None:
        return _embedding_adapter_cache

    from src.shared.config import settings  # noqa: PLC0415

    provider = settings.EMBEDDING_PROVIDER
    logger.info("Initializing embedding adapter: provider=%s", provider)

    if settings.INFERENCE_PROVIDER == "mock":
        # In mock mode, always use the mock embedding adapter
        _embedding_adapter_cache = MockEmbeddingAdapter()
    elif provider == "local":
        _embedding_adapter_cache = LocalEmbeddingAdapter()
    elif provider == "fireworks":
        _embedding_adapter_cache = FireworksEmbeddingAdapter()
    else:
        raise ValueError(f"Unknown EMBEDDING_PROVIDER: '{provider}'")

    return _embedding_adapter_cache


def reset_embedding_adapter_cache() -> None:
    """Reset embedding adapter cache — used in tests."""
    global _embedding_adapter_cache
    _embedding_adapter_cache = None
