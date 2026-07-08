"""Observability module for tracking AI runtime operations, tracing, and metrics."""
from __future__ import annotations

import logging
import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

logger = logging.getLogger("helix.ai_runtime.observability")


class AIRuntimeTracker:
    """Tracks LLM API usage, tokens, costs, and latencies."""

    def __init__(self) -> None:
        self.metrics: dict[str, Any] = {
            "total_calls": 0,
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "total_cost_usd": 0.0,
            "latencies": [],
        }

    def record_call(
        self,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cost_usd: float,
        latency_ms: float,
    ) -> None:
        """Record the metrics of an LLM call."""
        self.metrics["total_calls"] += 1
        self.metrics["total_prompt_tokens"] += prompt_tokens
        self.metrics["total_completion_tokens"] += completion_tokens
        self.metrics["total_cost_usd"] += cost_usd
        self.metrics["latencies"].append(latency_ms)

        logger.info(
            "AI Call Recorded: provider=%s model=%s tokens=%d/%d cost=$%.4f latency=%.2fms",
            provider,
            model,
            prompt_tokens,
            completion_tokens,
            cost_usd,
            latency_ms,
        )

    def get_summary(self) -> dict[str, Any]:
        """Return a copy of the accumulated metrics."""
        latencies = self.metrics["latencies"]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
        return {
            **self.metrics,
            "average_latency_ms": avg_latency,
        }


# Global tracer singleton
tracker = AIRuntimeTracker()


@asynccontextmanager
async def trace_ai_operation(
    operation_name: str,
    investigation_id: uuid.UUID | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """Async context manager to trace and log an AI operation's execution time and metadata."""
    trace_id = uuid.uuid4()
    start_time = time.perf_counter()
    metadata: dict[str, Any] = {}

    logger.info(
        "AI Trace Start [%s]: name=%s investigation_id=%s",
        trace_id,
        operation_name,
        investigation_id,
    )

    try:
        yield metadata
        status = "success"
    except Exception as e:
        status = "failed"
        metadata["error"] = str(e)
        logger.error(
            "AI Trace Error [%s]: name=%s error=%s",
            trace_id,
            operation_name,
            e,
            exc_info=True,
        )
        raise
    finally:
        end_time = time.perf_counter()
        duration_ms = (end_time - start_time) * 1000.0
        logger.info(
            "AI Trace End [%s]: name=%s status=%s duration=%.2fms",
            trace_id,
            operation_name,
            status,
            duration_ms,
        )
