"""Prompt engine: Jinja2 template management and rendering for AI prompts.

Templates live in src/ai_runtime/prompts/ as .j2 files.
The engine loads templates lazily and caches them.
"""
from __future__ import annotations

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined, TemplateNotFound

logger = logging.getLogger(__name__)

# Template directory relative to this file
_TEMPLATE_DIR = Path(__file__).parent / "prompts"


class PromptEngine:
    """Jinja2-backed template engine for AI prompt generation.

    Templates support all Jinja2 features: conditionals, loops, filters.
    StrictUndefined mode raises an error for any undefined variable,
    preventing silent prompt corruption.
    """

    def __init__(self, template_dir: Path | None = None) -> None:
        dir_path = template_dir or _TEMPLATE_DIR
        self._env = Environment(
            loader=FileSystemLoader(str(dir_path)),
            undefined=StrictUndefined,
            trim_blocks=True,
            lstrip_blocks=True,
            autoescape=False,  # Prompts are plain text, not HTML
        )

    def render(self, template_name: str, **context) -> str:
        """Render a Jinja2 template with the given context variables.

        Args:
            template_name: Template filename (e.g. 'hypothesis_generation.j2').
            **context: Template variables.

        Returns:
            Rendered prompt string.

        Raises:
            TemplateNotFound: Template file doesn't exist.
            jinja2.UndefinedError: A required template variable was not provided.
        """
        try:
            template = self._env.get_template(template_name)
        except TemplateNotFound:
            raise TemplateNotFound(
                f"Prompt template '{template_name}' not found in {_TEMPLATE_DIR}"
            )

        rendered = template.render(**context)
        logger.debug("Rendered template '%s' → %d chars", template_name, len(rendered))
        return rendered

    def render_hypothesis_generation(
        self,
        investigation_title: str,
        investigation_description: str,
        evidence_chunks: list[dict],
        num_hypotheses: int = 3,
    ) -> str:
        """Render the hypothesis generation prompt.

        Args:
            investigation_title: Title of the investigation.
            investigation_description: Investigation description text.
            evidence_chunks: List of dicts with 'content', 'source', 'score'.
            num_hypotheses: Number of hypotheses to generate.

        Returns:
            Rendered prompt string ready for LLM inference.
        """
        return self.render(
            "hypothesis_generation.j2",
            investigation_title=investigation_title,
            investigation_description=investigation_description,
            evidence_chunks=evidence_chunks,
            num_hypotheses=num_hypotheses,
        )

    def render_capa_draft(
        self,
        investigation_title: str,
        hypotheses: list[dict],
        evidence_summary: str,
        org_context: str = "",
    ) -> str:
        """Render the CAPA drafting prompt.

        Args:
            investigation_title: Title of the investigation.
            hypotheses: List of accepted hypothesis dicts with 'title', 'content'.
            evidence_summary: Brief summary of evidence analyzed.
            org_context: Optional organisation-specific CAPA context/requirements.

        Returns:
            Rendered prompt string.
        """
        return self.render(
            "capa_draft.j2",
            investigation_title=investigation_title,
            hypotheses=hypotheses,
            evidence_summary=evidence_summary,
            org_context=org_context,
        )

    def render_investigation_summary(
        self,
        investigation_title: str,
        investigation_description: str,
        evidence_items: list[dict],
        hypotheses: list[dict],
    ) -> str:
        """Render the investigation summary prompt.

        Args:
            investigation_title: Title of the investigation.
            investigation_description: Investigation description.
            evidence_items: List of evidence metadata dicts.
            hypotheses: List of hypothesis dicts.

        Returns:
            Rendered prompt string.
        """
        return self.render(
            "investigation_summary.j2",
            investigation_title=investigation_title,
            investigation_description=investigation_description,
            evidence_items=evidence_items,
            hypotheses=hypotheses,
        )


# Module-level singleton
_engine: PromptEngine | None = None


def get_prompt_engine() -> PromptEngine:
    """Return the cached PromptEngine singleton."""
    global _engine
    if _engine is None:
        _engine = PromptEngine()
    return _engine
