from pydantic import BaseModel
from typing import List
from .agent_state import AgentState

class InvestigationHealth(BaseModel):
    completeness: int
    compliance: int
    slaStatus: str

class RuntimeSnapshot(BaseModel):
    phase: str
    progress: float
    activeAgents: List[str]
    completedAgents: List[str]
    pendingAgents: List[str]
    investigationHealth: InvestigationHealth
    momentum: str
    lastUpdated: str
    agentStates: List[AgentState]
