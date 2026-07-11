# ADR-004: Runtime Boundaries

## Decision
Rename the existing `platform` domain to `runtime` (or adapt it as a compatibility layer) and establish an `InvestigationContext` boundary that all subsequent actions depend upon.

## Reason
The term "platform" is overly broad and often becomes a dumping ground for unrelated utilities. The existing code inside `platform` (e.g., `runtime_engine.py`, `event_bus.py`) actually implements the investigation orchestration runtime. Clarifying this as `runtime` sets a clear boundary for where events, agent state, and investigation timelines are managed.

## Alternatives Considered
- Creating a new `runtime` folder and keeping `platform`: Rejected as it creates confusion and duplicated responsibilities.
- Placing runtime logic in `investigation`: Rejected because an investigation is a data model/lifecycle entity, whereas the runtime is the engine driving the state machine and AI agents.

## Consequences
- `InvestigationContext` becomes the standardized payload passed between agents and the UI.
- All orchestration and event emission is strictly contained within `runtime`.
