"""AI Runtime Workflow Engine.

Workflows coordinate multiple AI primitive calls to execute specific business processes.
"""
from __future__ import annotations

from src.ai_runtime.workflows.capa_workflow import CapaWorkflow
from src.ai_runtime.workflows.hypothesis_workflow import HypothesisWorkflow
from src.ai_runtime.workflows.investigation_workflow import InvestigationWorkflow
from src.ai_runtime.workflows.knowledge_capture_workflow import KnowledgeCaptureWorkflow

__all__ = [
    "InvestigationWorkflow",
    "HypothesisWorkflow",
    "CapaWorkflow",
    "KnowledgeCaptureWorkflow",
]
