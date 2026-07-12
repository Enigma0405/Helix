import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any

class StorageAdapter(ABC):
    """
    Abstract interface for persisting organization memory data.
    Decouples the repository logic from the physical storage mechanism 
    (Local FS, S3, MinIO, Blob Storage).
    """
    
    @abstractmethod
    def save(self, tenant_id: str, collection: str, object_id: str, data: Dict[str, Any]) -> None:
        """Saves a JSON dict to the specified tenant collection."""
        pass
        
    @abstractmethod
    def load(self, tenant_id: str, collection: str, object_id: str) -> Dict[str, Any]:
        """Loads a JSON dict from the specified tenant collection."""
        pass


class LocalFilesystemAdapter(StorageAdapter):
    """Implementation of StorageAdapter that writes to the local disk."""
    
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        
    def _get_path(self, tenant_id: str, collection: str, object_id: str) -> Path:
        """Resolves the physical file path."""
        # e.g., organizations/apex_precision/organization_memory/entities/eqp_7741.json
        # The base_dir is expected to be the 'organizations' folder root
        target_dir = self.base_dir / tenant_id / "organization_memory" / collection
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir / f"{object_id}.json"
        
    def save(self, tenant_id: str, collection: str, object_id: str, data: Dict[str, Any]) -> None:
        file_path = self._get_path(tenant_id, collection, object_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
    def load(self, tenant_id: str, collection: str, object_id: str) -> Dict[str, Any]:
        file_path = self._get_path(tenant_id, collection, object_id)
        if not file_path.exists():
            raise FileNotFoundError(f"Object {object_id} not found in collection {collection} for tenant {tenant_id}")
            
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
