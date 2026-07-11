from abc import ABC, abstractmethod
from typing import BinaryIO, Union

class StorageProvider(ABC):
    """Abstract interface for object storage operations."""

    @abstractmethod
    async def ensure_buckets(self) -> None:
        pass

    @abstractmethod
    async def upload_file(
        self,
        bucket: str,
        object_name: str,
        data: Union[bytes, BinaryIO],
        content_type: str = "application/octet-stream",
        length: int = -1,
    ) -> str:
        pass

    @abstractmethod
    async def download_file(self, bucket: str, object_name: str) -> bytes:
        pass

    @abstractmethod
    async def delete_file(self, bucket: str, object_name: str) -> None:
        pass

    @abstractmethod
    async def get_presigned_url(
        self,
        bucket: str,
        object_name: str,
        expires_seconds: int = 3600,
    ) -> str:
        pass
