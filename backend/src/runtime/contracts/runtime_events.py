from enum import Enum
from pydantic import BaseModel
from typing import Any

class EventType(str, Enum):
    KNOWLEDGE_RETRIEVED = "KnowledgeRetrieved"
    TIMELINE_CONSTRUCTED = "TimelineConstructed"
    HYPOTHESIS_GENERATED = "HypothesisGenerated"
    CONFIDENCE_UPDATED = "ConfidenceUpdated"
    NEXT_BEST_ACTION_CALCULATED = "NextBestActionCalculated"
    APPROVAL_REQUESTED = "ApprovalRequested"
    INVESTIGATION_COMPLETED = "InvestigationCompleted"
    AGENT_STARTED = "AgentStarted"
    AGENT_COMPLETED = "AgentCompleted"

class EventSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"

class RuntimeEvent(BaseModel):
    id: str
    timestamp: str
    type: EventType
    sourceAgent: str
    severity: EventSeverity
    payload: Any
