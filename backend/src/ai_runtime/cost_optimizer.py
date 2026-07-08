"""Cost optimizer for estimating LLM token usage costs and selecting cost-effective routes."""
from __future__ import annotations

import logging

logger = logging.getLogger("helix.ai_runtime.cost_optimizer")

# Pricing per million tokens (July 2026 estimation/mock pricing)
PROVIDER_PRICING = {
    "fireworks": {
        "accounts/fireworks/models/gemma2-9b-it": {"prompt": 0.20, "completion": 0.20},
        "accounts/fireworks/models/gemma2-27b-it": {"prompt": 0.80, "completion": 0.80},
        "accounts/fireworks/models/gemma3-27b-it": {"prompt": 0.80, "completion": 0.80},
        "accounts/fireworks/models/llama-v3p3-70b-instruct": {"prompt": 0.90, "completion": 0.90},
        "default": {"prompt": 0.50, "completion": 0.50},
    },
    "openai": {
        "gpt-4o": {"prompt": 5.00, "completion": 15.00},
        "gpt-4o-mini": {"prompt": 0.150, "completion": 0.600},
        "default": {"prompt": 2.50, "completion": 10.00},
    },
    "local": {
        "default": {"prompt": 0.0, "completion": 0.0},
    },
    "mock": {
        "default": {"prompt": 0.0, "completion": 0.0},
    },
}


class CostOptimizer:
    """Estimates the cost of LLM inference requests and helps minimize API spend."""

    @staticmethod
    def calculate_cost(
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> float:
        """Calculate the cost in USD of a completion request.

        Args:
            provider: The API provider name (fireworks|openai|local|mock).
            model: The specific model ID used.
            prompt_tokens: Number of prompt/input tokens.
            completion_tokens: Number of completion/output tokens.

        Returns:
            Estimated cost in USD.
        """
        pricing = PROVIDER_PRICING.get(provider, PROVIDER_PRICING["local"])

        # Try to match the model, fallback to default for that provider
        model_pricing = pricing.get(model, pricing.get("default", {"prompt": 0.0, "completion": 0.0}))

        prompt_cost = (prompt_tokens / 1_000_000.0) * model_pricing["prompt"]
        completion_cost = (completion_tokens / 1_000_000.0) * model_pricing["completion"]

        total_cost = prompt_cost + completion_cost
        logger.debug(
            "Cost Calculated: provider=%s, model=%s, tokens=%d/%d, cost_usd=%.6f",
            provider,
            model,
            prompt_tokens,
            completion_tokens,
            total_cost,
        )
        return total_cost

    @staticmethod
    def count_tokens_approx(text: str) -> int:
        """A simple character-heuristic token counter.

        Rule of thumb: 1 token ≈ 4 characters of standard English text.
        """
        if not text:
            return 0
        return max(1, len(text) // 4)
