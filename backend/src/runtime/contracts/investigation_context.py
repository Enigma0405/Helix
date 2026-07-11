from pydantic import BaseModel
from typing import Any, List, Dict
from .runtime_snapshot import RuntimeSnapshot

class InvestigationContextV1(BaseModel):
    metadata: Dict[str, Any]
    health: Dict[str, Any]
    momentum: str
    evidence: List[Any]
    knowledge: Dict[str, Any]
    intelligence: Dict[str, Any]
    runtime: RuntimeSnapshot
    actions: Dict[str, Any]
