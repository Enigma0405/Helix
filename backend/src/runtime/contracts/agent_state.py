from enum import Enum
from pydantic import BaseModel

class AgentStatus(str, Enum):
    QUEUED = "Queued"
    RUNNING = "Running"
    THINKING = "Thinking"
    WAITING = "Waiting"
    COMPLETED = "Completed"

class AgentState(BaseModel):
    agentName: str
    status: AgentStatus
