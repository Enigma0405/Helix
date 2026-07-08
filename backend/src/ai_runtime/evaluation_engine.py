"""Evaluation engine: computes and records first-class AI evaluation metrics.

Tracks Retrieval Recall@k, Citation Precision, Grounding Score, Hallucination Rate,
and response latencies.
"""
from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger("helix.ai_runtime.evaluation_engine")


class EvaluationEngine:
    """Computes, monitors, and logs metrics for AI operations."""

    @staticmethod
    def calculate_grounding_score(
        valid_citations: int,
        total_citations: int,
    ) -> float:
        """Grounding score: ratio of valid citations to total citations."""
        if total_citations <= 0:
            return 0.0
        return round(valid_citations / total_citations, 4)

    @staticmethod
    def calculate_citation_precision(
        citations_used: int,
        citations_provided: int,
    ) -> float:
        """Citation precision: % of provided evidence citations that were actually relevant/referenced."""
        if citations_provided <= 0:
            return 0.0
        return round(citations_used / citations_provided, 4)

    @staticmethod
    def calculate_recall_at_k(
        retrieved_ids: list[Any],
        relevant_ids: list[Any],
        k: int,
    ) -> float:
        """Recall@k: fraction of expected ground-truth items retrieved in the top k results."""
        if not relevant_ids:
            return 1.0

        top_k_retrieved = set(retrieved_ids[:k])
        matches = sum(1 for rid in relevant_ids if rid in top_k_retrieved)
        return round(matches / len(relevant_ids), 4)

    @staticmethod
    def log_evaluation_metrics(
        operation: str,
        latency_ms: float,
        cost_usd: float,
        grounding_score: float | None = None,
        citation_precision: float | None = None,
        hallucination_detected: bool = False,
    ) -> dict[str, Any]:
        """Aggregate and log key metrics for observability."""
        metrics = {
            "operation": operation,
            "latency_ms": round(latency_ms, 2),
            "cost_usd": round(cost_usd, 6),
            "timestamp": time.time(),
        }

        if grounding_score is not None:
            metrics["grounding_score"] = grounding_score
        if citation_precision is not None:
            metrics["citation_precision"] = citation_precision

        metrics["hallucination_detected"] = hallucination_detected

        logger.info(
            "AI EVALUATION [%s]: latency=%.2fms cost=$%.6f grounding=%s precision=%s hallucination=%s",
            operation,
            latency_ms,
            cost_usd,
            f"{grounding_score:.3f}" if grounding_score is not None else "N/A",
            f"{citation_precision:.3f}" if citation_precision is not None else "N/A",
            "YES" if hallucination_detected else "NO",
        )

        return metrics
