from typing import Callable, Dict, List
from .contracts.runtime_events import RuntimeEvent

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[RuntimeEvent], None]]] = {}
        self._all_events_subscribers: List[Callable[[RuntimeEvent], None]] = []

    def subscribe(self, event_type: str, handler: Callable[[RuntimeEvent], None]) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def subscribe_all(self, handler: Callable[[RuntimeEvent], None]) -> None:
        self._all_events_subscribers.append(handler)

    def publish(self, event: RuntimeEvent) -> None:
        for handler in self._all_events_subscribers:
            try:
                handler(event)
            except Exception as e:
                print(f"Error in global event handler for {event.type}: {e}")
                
        if event.type in self._subscribers:
            for handler in self._subscribers[event.type]:
                try:
                    handler(event)
                except Exception as e:
                    print(f"Error in event handler for {event.type}: {e}")

# Global instance for the in-process event bus
event_bus = EventBus()
