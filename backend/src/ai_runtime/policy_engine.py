"""Policy engine: content filtering, guardrails, and confidence thresholds.

Ensures AI-generated content meets safety and quality standards before
being stored or returned to users.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class PolicyCheckResult:
    """Result of a policy compliance check."""

    passed: bool
    violations: list[str]  # Human-readable violation messages
    filtered_content: str  # Content after applying filters (may be truncated/redacted)


class PolicyEngine:
    """Guardrails and content filtering for AI-generated outputs.

    Enforces:
    - Maximum response length
    - Confidence threshold enforcement
    - Blocked content patterns (PII, inappropriate content)
    - Minimum grounding score requirements
    """

    # Patterns that indicate potentially problematic content
    _BLOCKED_PATTERNS: list[re.Pattern] = [
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN pattern
        re.compile(r"\b\d{16}\b"),  # Credit card numbers
        re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),  # Email (warn)
    ]

    def __init__(
        self,
        max_response_tokens: int = 4096,
        min_confidence: float = 0.3,
        min_grounding_score: float = 0.3,
        max_content_chars: int = 50_000,
    ) -> None:
        """Initialise the policy engine with configurable thresholds.

        Args:
            max_response_tokens: Maximum tokens in generated response.
            min_confidence: Minimum confidence score for hypothesis acceptance.
            min_grounding_score: Minimum grounding score before content is flagged.
            max_content_chars: Hard cap on response character count.
        """
        self.max_response_tokens = max_response_tokens
        self.min_confidence = min_confidence
        self.min_grounding_score = min_grounding_score
        self.max_content_chars = max_content_chars

    def check_content(
        self,
        content: str,
        confidence_score: float | None = None,
        grounding_score: float | None = None,
    ) -> PolicyCheckResult:
        """Run full policy check on AI-generated content.

        Args:
            content: Generated text to check.
            confidence_score: Optional confidence score to validate against threshold.
            grounding_score: Optional grounding score to validate.

        Returns:
            PolicyCheckResult with pass/fail and violation details.
        """
        violations: list[str] = []
        filtered = content

        # 1. Length check
        if len(content) > self.max_content_chars:
            violations.append(
                f"Content exceeds maximum length: {len(content)} > {self.max_content_chars} chars"
            )
            filtered = filtered[: self.max_content_chars] + "\n\n[Content truncated by policy]"
            logger.warning("Policy: content truncated from %d to %d chars", len(content), self.max_content_chars)

        # 2. Confidence score threshold
        if confidence_score is not None and confidence_score < self.min_confidence:
            violations.append(
                f"Confidence score {confidence_score:.3f} below threshold {self.min_confidence:.3f}"
            )
            logger.info(
                "Policy: low confidence score %.3f (threshold %.3f)",
                confidence_score,
                self.min_confidence,
            )

        # 3. Grounding score check
        if grounding_score is not None and grounding_score < self.min_grounding_score:
            violations.append(
                f"Grounding score {grounding_score:.3f} below threshold {self.min_grounding_score:.3f} — "
                f"content may contain unsupported claims"
            )
            logger.warning(
                "Policy: low grounding score %.3f (threshold %.3f)",
                grounding_score,
                self.min_grounding_score,
            )

        # 4. Blocked content patterns
        for pattern in self._BLOCKED_PATTERNS:
            matches = pattern.findall(filtered)
            if matches:
                violations.append(
                    f"Content contains potentially sensitive pattern: {pattern.pattern}"
                )
                # Redact matches
                filtered = pattern.sub("[REDACTED]", filtered)
                logger.warning(
                    "Policy: redacted %d matches of pattern '%s'",
                    len(matches),
                    pattern.pattern,
                )

        passed = len(violations) == 0
        if not passed:
            logger.info("Policy check FAILED with %d violations", len(violations))

        return PolicyCheckResult(
            passed=passed,
            violations=violations,
            filtered_content=filtered,
        )

    def enforce_prompt_limits(self, prompt: str) -> str:
        """Enforce maximum prompt length before sending to the LLM.

        Truncates the prompt at the evidence section if it's too long,
        keeping system instructions intact.

        Args:
            prompt: Full prompt string.

        Returns:
            Possibly truncated prompt.
        """
        # Approximate token count: 1 token ≈ 4 chars
        approx_tokens = len(prompt) // 4
        if approx_tokens > self.max_response_tokens * 2:
            truncate_at = self.max_response_tokens * 2 * 4
            logger.warning(
                "Prompt truncated from ~%d to ~%d tokens",
                approx_tokens,
                self.max_response_tokens * 2,
            )
            return prompt[:truncate_at] + "\n\n[Evidence truncated due to context length limits]"
        return prompt

    def validate_hypothesis_confidence(
        self, confidence: float
    ) -> tuple[bool, str | None]:
        """Check if a hypothesis confidence score meets the minimum threshold.

        Args:
            confidence: Confidence score between 0.0 and 1.0.

        Returns:
            (passes, rejection_reason) — reason is None if passes.
        """
        if confidence < self.min_confidence:
            reason = (
                f"Hypothesis confidence {confidence:.2f} is below the "
                f"minimum threshold of {self.min_confidence:.2f}. "
                "The hypothesis requires stronger evidence support."
            )
            return False, reason
        return True, None
