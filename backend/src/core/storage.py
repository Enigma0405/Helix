"""Async MinIO storage wrapper — SDK is synchronous, wrapped with run_in_executor."""
from __future__ import annotations

import asyncio
import io
import logging
import uuid
from functools import partial
from typing import BinaryIO

from minio import Minio
from minio.commonconfig import ENABLED, Filter
from minio.lifecycleconfig import LifecycleConfig, Rule, Expiration

from src.core.config import settings

logger = logging.getLogger(__name__)

# ── MinIO client (synchronous SDK) ────────────────────────────────────────────
_client: Minio | None = None


def _get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


def _ensure_bucket(bucket: str) -> None:
    """Create bucket if it does not exist (synchronous)."""
    client = _get_client()
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        logger.info("Created MinIO bucket: %s", bucket)


async def ensure_buckets() -> None:
    """Ensure all three application buckets exist — called at startup."""
    loop = asyncio.get_event_loop()
    for bucket in [
        settings.MINIO_BUCKET_EVIDENCE,
        settings.MINIO_BUCKET_DOCUMENTS,
        settings.MINIO_BUCKET_EXPORTS,
    ]:
        await loop.run_in_executor(None, _ensure_bucket, bucket)


# ── Core async operations ─────────────────────────────────────────────────────

async def upload_file(
    bucket: str,
    object_name: str,
    data: bytes | BinaryIO,
    content_type: str = "application/octet-stream",
    length: int = -1,
) -> str:
    """Upload bytes or file-like object to MinIO.

    Args:
        bucket: Target bucket name.
        object_name: Path/key inside the bucket.
        data: Raw bytes or file-like object.
        content_type: MIME type.
        length: Content length; -1 means unknown (uses multipart).

    Returns:
        The storage key (object_name) for later retrieval.
    """
    loop = asyncio.get_event_loop()
    client = _get_client()

    if isinstance(data, bytes):
        stream = io.BytesIO(data)
        size = len(data)
    else:
        stream = data
        size = length

    def _put() -> None:
        client.put_object(
            bucket,
            object_name,
            stream,
            length=size,
            content_type=content_type,
        )

    await loop.run_in_executor(None, _put)
    logger.debug("Uploaded %s/%s (%d bytes)", bucket, object_name, size)
    return object_name


async def download_file(bucket: str, object_name: str) -> bytes:
    """Download an object from MinIO and return raw bytes.

    Args:
        bucket: Source bucket name.
        object_name: Path/key inside the bucket.

    Returns:
        File contents as bytes.
    """
    loop = asyncio.get_event_loop()
    client = _get_client()

    def _get() -> bytes:
        response = client.get_object(bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    return await loop.run_in_executor(None, _get)


async def delete_file(bucket: str, object_name: str) -> None:
    """Delete an object from MinIO.

    Args:
        bucket: Target bucket name.
        object_name: Path/key inside the bucket.
    """
    loop = asyncio.get_event_loop()
    client = _get_client()

    await loop.run_in_executor(
        None,
        partial(client.remove_object, bucket, object_name),
    )
    logger.debug("Deleted %s/%s", bucket, object_name)


async def get_presigned_url(
    bucket: str,
    object_name: str,
    expires_seconds: int = 3600,
) -> str:
    """Generate a presigned GET URL for temporary file access.

    Args:
        bucket: Target bucket name.
        object_name: Path/key inside the bucket.
        expires_seconds: URL validity in seconds (default 1 hour).

    Returns:
        Presigned URL string.
    """
    from datetime import timedelta

    loop = asyncio.get_event_loop()
    client = _get_client()

    def _presign() -> str:
        return client.presigned_get_object(
            bucket,
            object_name,
            expires=timedelta(seconds=expires_seconds),
        )

    return await loop.run_in_executor(None, _presign)


def generate_storage_key(prefix: str, filename: str, org_id: str) -> str:
    """Generate a deterministic, collision-resistant storage key.

    Format: ``{prefix}/{org_id}/{uuid}/{filename}``
    """
    return f"{prefix}/{org_id}/{uuid.uuid4()}/{filename}"
