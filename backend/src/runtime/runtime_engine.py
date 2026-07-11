from typing import Dict, List, Optional
import time
import uuid
import datetime
from .event_bus import event_bus
from .contracts.runtime_events import RuntimeEvent, EventType, EventSeverity
from .contracts.agent_state import AgentState, AgentStatus
from .contracts.runtime_snapshot import RuntimeSnapshot, InvestigationHealth

class RuntimeEngine:
    """
    Coordinates execution, manages Agent States, and emits events to the Event Bus.
    Wraps deterministic execution for now.
    """
    def __init__(self):
        # In-memory storage for hackathon demo
        # Maps investigation_id -> dict of state
        self.investigations: Dict[str, dict] = {}

    def start_investigation(self, investigation_id: str) -> None:
        if investigation_id in self.investigations:
            return

        self.investigations[investigation_id] = {
            "start_time": time.time(),
            "phase": "Initialization",
            "progress": 0.0,
            "momentum": "🟢 Advancing",
            "health": InvestigationHealth(completeness=0, compliance=0, slaStatus="On Track"),
            "agent_states": [
                AgentState(agentName="Evidence Agent", status=AgentStatus.QUEUED),
                AgentState(agentName="Knowledge Agent", status=AgentStatus.QUEUED),
                AgentState(agentName="Timeline Agent", status=AgentStatus.QUEUED),
                AgentState(agentName="Root Cause Agent", status=AgentStatus.QUEUED),
                AgentState(agentName="Compliance Agent", status=AgentStatus.QUEUED),
                AgentState(agentName="CAPA Agent", status=AgentStatus.QUEUED)
            ]
        }
        
    def _emit(self, event_type: EventType, source_agent: str, payload: dict) -> None:
        event = RuntimeEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            type=event_type,
            sourceAgent=source_agent,
            severity=EventSeverity.INFO,
            payload=payload
        )
        event_bus.publish(event)

    def advance_simulation(self, investigation_id: str) -> None:
        """
        For Milestone B, this acts as the Simulation Adapter natively integrated,
        advancing the state based on how much time has passed since it started.
        """
        if investigation_id not in self.investigations:
            self.start_investigation(investigation_id)
            
        inv = self.investigations[investigation_id]
        elapsed = time.time() - inv["start_time"]
        
        # Simple deterministic timeline based on elapsed seconds
        if elapsed < 2:
            inv["phase"] = "Evidence Retrieval"
            inv["progress"] = 0.15
            inv["agent_states"][0].status = AgentStatus.RUNNING
            inv["health"].completeness = 15
        elif elapsed < 4:
            if inv["agent_states"][0].status != AgentStatus.COMPLETED:
                inv["agent_states"][0].status = AgentStatus.COMPLETED
                self._emit(EventType.KNOWLEDGE_RETRIEVED, "Evidence Agent", {"count": 42})
            inv["phase"] = "Knowledge Retrieval"
            inv["progress"] = 0.35
            inv["agent_states"][1].status = AgentStatus.RUNNING
            inv["health"].completeness = 38
        elif elapsed < 7:
            if inv["agent_states"][1].status != AgentStatus.COMPLETED:
                inv["agent_states"][1].status = AgentStatus.COMPLETED
                self._emit(EventType.KNOWLEDGE_RETRIEVED, "Knowledge Agent", {"sops": ["SOP-STER-014"]})
            inv["phase"] = "Timeline Reconstruction"
            inv["progress"] = 0.50
            inv["agent_states"][2].status = AgentStatus.RUNNING
            inv["health"].completeness = 61
            inv["health"].compliance = 40
        elif elapsed < 10:
            if inv["agent_states"][2].status != AgentStatus.COMPLETED:
                inv["agent_states"][2].status = AgentStatus.COMPLETED
                self._emit(EventType.TIMELINE_CONSTRUCTED, "Timeline Agent", {"events_mapped": 14})
            inv["phase"] = "Root Cause Analysis"
            inv["progress"] = 0.70
            inv["agent_states"][3].status = AgentStatus.RUNNING
            inv["health"].completeness = 80
        elif elapsed < 12:
            if inv["agent_states"][3].status != AgentStatus.COMPLETED:
                inv["agent_states"][3].status = AgentStatus.COMPLETED
                self._emit(EventType.HYPOTHESIS_GENERATED, "Root Cause Agent", {"hypotheses_count": 3})
            inv["phase"] = "Compliance Checking"
            inv["progress"] = 0.85
            inv["agent_states"][4].status = AgentStatus.RUNNING
            inv["health"].completeness = 92
            inv["health"].compliance = 85
        else:
            if inv["agent_states"][4].status != AgentStatus.COMPLETED:
                inv["agent_states"][4].status = AgentStatus.COMPLETED
                self._emit(EventType.NEXT_BEST_ACTION_CALCULATED, "Compliance Agent", {"action": "Quarantine Batch"})
            inv["phase"] = "Action Recommendation"
            inv["progress"] = 1.0
            inv["agent_states"][5].status = AgentStatus.WAITING # Waiting on human
            inv["momentum"] = "🟡 Waiting on Human"
            inv["health"].completeness = 100
            inv["health"].compliance = 100
            
    def get_snapshot(self, investigation_id: str) -> RuntimeSnapshot:
        # Advance the deterministic simulation before returning snapshot
        self.advance_simulation(investigation_id)
        
        inv = self.investigations[investigation_id]
        
        active_agents = [a.agentName for a in inv["agent_states"] if a.status in (AgentStatus.RUNNING, AgentStatus.THINKING)]
        completed_agents = [a.agentName for a in inv["agent_states"] if a.status == AgentStatus.COMPLETED]
        pending_agents = [a.agentName for a in inv["agent_states"] if a.status in (AgentStatus.QUEUED, AgentStatus.WAITING)]
        
        return RuntimeSnapshot(
            phase=inv["phase"],
            progress=inv["progress"],
            activeAgents=active_agents,
            completedAgents=completed_agents,
            pendingAgents=pending_agents,
            investigationHealth=inv["health"],
            momentum=inv["momentum"],
            lastUpdated=datetime.datetime.utcnow().isoformat() + "Z",
            agentStates=inv["agent_states"]
        )

# Global singleton
runtime_engine = RuntimeEngine()
