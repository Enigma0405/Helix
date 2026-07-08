"""Citation validator: grounding verification and hallucination detection.

Uses difflib sequence matching to measure how well LLM-generated content
is grounded in the retrieved evidence chunks (citations).
"""
from __future__ import annotations

import difflib
import logging
import re
import uuid
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CitationValidationResult:
    """Result of validating a generated hypothesis or CAPA against citations."""

    grounding_score: float  # 0.0 to 1.0 — how well content matches evidence
    citation_precision: float  # fraction of citations that are actually relevant
    is_grounded: bool  # True if grounding_score >= threshold
    suspicious_claims: list[str]  # Sentences not supported by any citation
    validated_citations: list[dict]  # Citations that were verified
    unverified_citations: list[dict]  # Citations that couldn't be verified


class CitationValidator:
    """Validates AI-generated content against source citations.

    Grounding Score: Measures what fraction of generated sentences have
    significant overlap with at least one evidence chunk.

    Hallucination Detection: Flags sentences with no evidence support
    as potentially hallucinated.
    """

    def __init__(
        self,
        grounding_threshold: float = 0.4,
        similarity_threshold: float = 0.5,
    ) -> None:
        """Initialise the validator.

        Args:
            grounding_threshold: Minimum grounding score to consider content grounded.
            similarity_threshold: Minimum similarity for a sentence to be "supported".
        """
        self.grounding_threshold = grounding_threshold
        self.similarity_threshold = similarity_threshold

    def _extract_sentences(self, text: str) -> list[str]:
        """Split text into individual sentences for analysis.

        Args:
            text: Input text.

        Returns:
            List of non-empty sentence strings.
        """
        # Split on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        # Filter out very short sentences (headers, single words)
        return [s.strip() for s in sentences if len(s.strip()) > 20]

    def _compute_similarity(self, text_a: str, text_b: str) -> float:
        """Compute bidirectional sequence similarity between two texts.

        Uses difflib's SequenceMatcher which is character-level but works well
        for substring detection common in citation validation.

        Args:
            text_a: First text string.
            text_b: Second text string.

        Returns:
            Similarity ratio between 0.0 and 1.0.
        """
        a_lower = text_a.lower()
        b_lower = text_b.lower()

        # Check substring containment first (common for direct quotes)
        if a_lower in b_lower or b_lower in a_lower:
            return 0.9

        # Full sequence similarity
        matcher = difflib.SequenceMatcher(None, a_lower, b_lower, autojunk=True)
        return matcher.ratio()

    def validate(
        self,
        generated_content: str,
        citations: list[dict],
    ) -> CitationValidationResult:
        """Validate generated content against the provided citations.

        Args:
            generated_content: LLM-generated text (hypothesis or CAPA content).
            citations: List of citation dicts with 'chunk_id', 'text', 'score', 'source'.

        Returns:
            CitationValidationResult with grounding score and flagged claims.
        """
        if not citations:
            logger.warning("No citations provided for validation — grounding score = 0.0")
            return CitationValidationResult(
                grounding_score=0.0,
                citation_precision=0.0,
                is_grounded=False,
                suspicious_claims=self._extract_sentences(generated_content),
                validated_citations=[],
                unverified_citations=[],
            )

        sentences = self._extract_sentences(generated_content)
        if not sentences:
            return CitationValidationResult(
                grounding_score=1.0,
                citation_precision=1.0,
                is_grounded=True,
                suspicious_claims=[],
                validated_citations=citations,
                unverified_citations=[],
            )

        citation_texts = [c.get("text", "") for c in citations]

        supported_count = 0
        suspicious_claims: list[str] = []
        validated_citation_indices: set[int] = set()

        for sentence in sentences:
            best_score = 0.0
            best_idx = -1

            for idx, citation_text in enumerate(citation_texts):
                sim = self._compute_similarity(sentence, citation_text)
                if sim > best_score:
                    best_score = sim
                    best_idx = idx

            if best_score >= self.similarity_threshold:
                supported_count += 1
                if best_idx >= 0:
                    validated_citation_indices.add(best_idx)
            else:
                suspicious_claims.append(sentence)
                logger.debug(
                    "Suspicious claim (score=%.3f): %.80s...", best_score, sentence
                )

        grounding_score = supported_count / len(sentences) if sentences else 1.0

        validated = [citations[i] for i in validated_citation_indices]
        unverified = [citations[i] for i in range(len(citations)) if i not in validated_citation_indices]

        # Citation precision: fraction of provided citations that were used
        citation_precision = len(validated_citation_indices) / len(citations) if citations else 0.0

        logger.info(
            "Citation validation: grounding=%.3f, precision=%.3f, suspicious=%d/%d sentences",
            grounding_score,
            citation_precision,
            len(suspicious_claims),
            len(sentences),
        )

        return CitationValidationResult(
            grounding_score=round(grounding_score, 4),
            citation_precision=round(citation_precision, 4),
            is_grounded=grounding_score >= self.grounding_threshold,
            suspicious_claims=suspicious_claims,
            validated_citations=validated,
            unverified_citations=unverified,
        )

    def compute_grounding_score(
        self, generated_content: str, evidence_texts: list[str]
    ) -> float:
        """Quick helper to compute only the grounding score without full validation.

        Args:
            generated_content: Generated text to check.
            evidence_texts: List of evidence text strings.

        Returns:
            Grounding score between 0.0 and 1.0.
        """
        if not evidence_texts:
            return 0.0

        synthetic_citations = [
            {"chunk_id": str(i), "text": t, "score": 1.0, "source": ""}
            for i, t in enumerate(evidence_texts)
        ]
        result = self.validate(generated_content, synthetic_citations)
        return result.grounding_score
