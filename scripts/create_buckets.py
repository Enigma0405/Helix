#!/usr/bin/env python3
"""
Project Helix — MinIO Bucket Setup Script
==========================================
Creates required MinIO buckets on startup.
Run this once after the MinIO service is healthy.

Usage:
    python scripts/create_buckets.py
    python scripts/create_buckets.py --endpoint localhost:9000

Buckets created:
    - helix-evidence   : Investigation evidence file uploads (PDFs, SOPs, etc.)
    - helix-documents  : Organization knowledge library documents
    - helix-exports    : Generated PDF reports and CAPA exports
"""

import sys
import os
import argparse
import time

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    print("ERROR: minio SDK not installed. Run: pip install minio")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Color output
# ---------------------------------------------------------------------------
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def ok(msg: str) -> None:
    print(f"{Colors.GREEN}  ✅ {msg}{Colors.RESET}")


def info(msg: str) -> None:
    print(f"{Colors.CYAN}  ℹ  {msg}{Colors.RESET}")


def warn(msg: str) -> None:
    print(f"{Colors.YELLOW}  ⚠️  {msg}{Colors.RESET}")


def err(msg: str) -> None:
    print(f"{Colors.RED}  ❌ {msg}{Colors.RESET}")


def header(msg: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}\n")


# ---------------------------------------------------------------------------
# Bucket definitions
# ---------------------------------------------------------------------------
BUCKETS = [
    {
        "name": "helix-evidence",
        "description": "Investigation evidence file uploads (PDFs, SOPs, batch records, etc.)",
        "versioning": True,
        "lifecycle_days": 365,
    },
    {
        "name": "helix-documents",
        "description": "Organization knowledge library documents (SOPs, guidelines, regulations)",
        "versioning": True,
        "lifecycle_days": None,  # No expiry — permanent library
    },
    {
        "name": "helix-exports",
        "description": "Generated PDF reports, CAPA exports, and investigation summaries",
        "versioning": False,
        "lifecycle_days": 90,
    },
]


# ---------------------------------------------------------------------------
# MinIO operations
# ---------------------------------------------------------------------------

def wait_for_minio(client: Minio, max_retries: int = 10, retry_delay: float = 3.0) -> bool:
    """Wait for MinIO to become available."""
    info(f"Waiting for MinIO to be ready (max {max_retries} retries)...")
    for attempt in range(1, max_retries + 1):
        try:
            # List buckets as a connectivity test
            list(client.list_buckets())
            ok("MinIO is ready!")
            return True
        except Exception as e:
            if attempt < max_retries:
                warn(f"  MinIO not ready (attempt {attempt}/{max_retries}): {e}")
                time.sleep(retry_delay)
            else:
                err(f"  MinIO not available after {max_retries} attempts: {e}")
                return False
    return False


def create_bucket(client: Minio, bucket_config: dict) -> bool:
    """Create a single MinIO bucket with configuration."""
    bucket_name = bucket_config["name"]
    description = bucket_config.get("description", "")

    info(f"Creating bucket: {bucket_name}")
    info(f"  Purpose: {description}")

    try:
        # Check if bucket already exists
        if client.bucket_exists(bucket_name):
            warn(f"  Bucket already exists: {bucket_name} (skipping)")
            return True

        # Create the bucket
        client.make_bucket(bucket_name)
        ok(f"  Bucket created: {bucket_name}")

        # Enable versioning if configured
        if bucket_config.get("versioning"):
            try:
                from minio.versioningconfig import VersioningConfig, ENABLED
                client.set_bucket_versioning(bucket_name, VersioningConfig(ENABLED))
                info(f"  Versioning enabled: {bucket_name}")
            except Exception as ve:
                warn(f"  Could not enable versioning (non-critical): {ve}")

        # Set bucket policy for internal access (no public access)
        # In production, configure fine-grained IAM policies
        info(f"  Access policy: private (internal only)")

        return True

    except S3Error as e:
        err(f"  S3 error creating bucket {bucket_name}: {e}")
        return False
    except Exception as e:
        err(f"  Unexpected error creating bucket {bucket_name}: {e}")
        return False


def set_bucket_tags(client: Minio, bucket_name: str, tags: dict) -> None:
    """Apply tags to a bucket for identification."""
    try:
        from minio.commonconfig import Tags
        tag_obj = Tags.new_bucket_tags()
        for k, v in tags.items():
            tag_obj[k] = v
        client.set_bucket_tags(bucket_name, tag_obj)
        info(f"  Tags applied to {bucket_name}: {tags}")
    except Exception as e:
        warn(f"  Could not set tags on {bucket_name} (non-critical): {e}")


def verify_buckets(client: Minio) -> bool:
    """Verify all expected buckets exist."""
    info("\nVerifying bucket setup...")
    existing = {b.name for b in client.list_buckets()}
    all_ok = True
    for bucket_config in BUCKETS:
        name = bucket_config["name"]
        if name in existing:
            ok(f"  Verified: {name}")
        else:
            err(f"  Missing: {name}")
            all_ok = False
    return all_ok


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Project Helix — MinIO Bucket Setup")
    parser.add_argument(
        "--endpoint",
        default=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        help="MinIO endpoint (default: localhost:9000)",
    )
    parser.add_argument(
        "--access-key",
        default=os.getenv("MINIO_ROOT_USER", os.getenv("MINIO_ACCESS_KEY", "minioadmin")),
        help="MinIO access key",
    )
    parser.add_argument(
        "--secret-key",
        default=os.getenv("MINIO_ROOT_PASSWORD", os.getenv("MINIO_SECRET_KEY", "change_me_in_production")),
        help="MinIO secret key",
    )
    parser.add_argument(
        "--secure",
        action="store_true",
        default=os.getenv("MINIO_SECURE", "false").lower() == "true",
        help="Use HTTPS (default: False for local dev)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=10,
        help="Max retries waiting for MinIO to be ready (default: 10)",
    )

    args = parser.parse_args()

    header("Project Helix — MinIO Bucket Setup")
    info(f"Endpoint:   {args.endpoint}")
    info(f"Access Key: {args.access_key}")
    info(f"Secure:     {args.secure}")

    # Create MinIO client
    client = Minio(
        endpoint=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key,
        secure=args.secure,
    )

    # Wait for MinIO to be ready
    if not wait_for_minio(client, max_retries=args.max_retries):
        return 1

    # Create all buckets
    print()
    success_count = 0
    for bucket_config in BUCKETS:
        if create_bucket(client, bucket_config):
            # Apply metadata tags
            set_bucket_tags(client, bucket_config["name"], {
                "project": "helix",
                "environment": os.getenv("ENVIRONMENT", "development"),
                "managed-by": "create_buckets.py",
            })
            success_count += 1
        print()

    # Verify setup
    all_verified = verify_buckets(client)

    print()
    header("Setup Complete!")

    if success_count == len(BUCKETS) and all_verified:
        print(f"{Colors.GREEN}  All {len(BUCKETS)} buckets created and verified.{Colors.RESET}")
        print(f"\n{Colors.CYAN}  MinIO Console: http://localhost:9001{Colors.RESET}")
        print(f"{Colors.CYAN}  User: {args.access_key}{Colors.RESET}\n")
        return 0
    else:
        err(f"  Only {success_count}/{len(BUCKETS)} buckets created successfully")
        return 1


if __name__ == "__main__":
    sys.exit(main())
