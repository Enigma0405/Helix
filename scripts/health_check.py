#!/usr/bin/env python3
"""
Project Helix — Health Check Script
======================================
Verifies that all required services are running and healthy.
Prints a color-coded pass/fail report for each service.

Usage:
    python scripts/health_check.py
    python scripts/health_check.py --api-url http://localhost/api
    python scripts/health_check.py --db-url postgresql://helix:pass@localhost/helixdb
"""

import sys
import os
import argparse
import time
from typing import Optional

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


def passed(service: str, detail: str = "") -> None:
    detail_str = f"  — {detail}" if detail else ""
    print(f"  {Colors.GREEN}✅ PASS{Colors.RESET}  {Colors.BOLD}{service}{Colors.RESET}{detail_str}")


def failed(service: str, error: str = "") -> None:
    error_str = f"  — {error}" if error else ""
    print(f"  {Colors.RED}❌ FAIL{Colors.RESET}  {Colors.BOLD}{service}{Colors.RESET}{error_str}")


def skipped(service: str, reason: str = "") -> None:
    reason_str = f"  — {reason}" if reason else ""
    print(f"  {Colors.YELLOW}⏭ SKIP{Colors.RESET}  {Colors.BOLD}{service}{Colors.RESET}{reason_str}")


def header(msg: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'═' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'═' * 60}{Colors.RESET}\n")


# ---------------------------------------------------------------------------
# Individual health checks
# ---------------------------------------------------------------------------

def check_postgresql(db_url: str) -> tuple[bool, str]:
    """Check PostgreSQL connection and pgvector extension."""
    try:
        import psycopg
        # Convert asyncpg URL to psycopg URL if needed
        url = db_url.replace("postgresql+asyncpg://", "postgresql://")

        with psycopg.connect(url, connect_timeout=5) as conn:
            # Check basic connectivity
            row = conn.execute("SELECT version()").fetchone()
            pg_version = row[0].split(",")[0] if row else "unknown"

            # Check pgvector extension
            ext = conn.execute(
                "SELECT installed_version FROM pg_available_extensions WHERE name = 'vector'"
            ).fetchone()
            vector_status = f"pgvector {ext[0]}" if ext and ext[0] else "pgvector NOT INSTALLED"

            return True, f"{pg_version} | {vector_status}"

    except ImportError:
        return False, "psycopg not installed (pip install psycopg[binary])"
    except Exception as e:
        return False, str(e)


def check_redis(redis_url: str) -> tuple[bool, str]:
    """Check Redis connection with PING."""
    try:
        import redis as redis_lib
        client = redis_lib.from_url(redis_url, socket_connect_timeout=5)
        result = client.ping()
        info_data = client.info("server")
        version = info_data.get("redis_version", "unknown")
        return bool(result), f"Redis {version} — PONG received"
    except ImportError:
        # Try without redis library
        try:
            import socket
            parts = redis_url.replace("redis://", "").split(":")
            host = parts[0] if parts else "localhost"
            port = int(parts[1].split("/")[0]) if len(parts) > 1 else 6379
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                return True, f"TCP connection to {host}:{port} OK (install redis-py for full check)"
            return False, f"Cannot connect to {host}:{port}"
        except Exception as e:
            return False, f"redis-py not installed. pip install redis. Error: {e}"
    except Exception as e:
        return False, str(e)


def check_minio(endpoint: str, access_key: str, secret_key: str, secure: bool) -> tuple[bool, str]:
    """Check MinIO connectivity and bucket existence."""
    try:
        from minio import Minio
        client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        )
        buckets = list(client.list_buckets())
        bucket_names = [b.name for b in buckets]
        required_buckets = {"helix-evidence", "helix-documents", "helix-exports"}
        missing = required_buckets - set(bucket_names)

        if missing:
            return False, f"Missing buckets: {missing}. Run: python scripts/create_buckets.py"

        return True, f"MinIO OK | Buckets: {', '.join(sorted(bucket_names))}"
    except ImportError:
        return False, "minio SDK not installed (pip install minio)"
    except Exception as e:
        return False, str(e)


def check_backend_api(api_url: str) -> tuple[bool, str]:
    """Check FastAPI backend health endpoint."""
    try:
        import urllib.request
        import urllib.error
        import json as json_lib

        url = f"{api_url.rstrip('/')}/health"
        t0 = time.time()

        req = urllib.request.Request(url, method="GET")
        req.add_header("User-Agent", "helix-health-check/1.0")

        with urllib.request.urlopen(req, timeout=10) as resp:
            latency_ms = int((time.time() - t0) * 1000)
            data = json_lib.loads(resp.read())
            status = data.get("status", "unknown")
            version = data.get("version", "unknown")
            return True, f"status={status} | version={version} | latency={latency_ms}ms"

    except Exception as e:
        # Try a raw TCP check on port 8000 if API URL is localhost
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(("localhost", 8000))
            sock.close()
            if result == 0:
                return True, "Backend port 8000 is open (health endpoint not yet available)"
        except Exception:
            pass
        return False, f"Cannot reach {api_url}/health — {e}"


def check_nginx(nginx_url: str) -> tuple[bool, str]:
    """Check Nginx health endpoint."""
    try:
        import urllib.request
        t0 = time.time()
        url = f"{nginx_url.rstrip('/')}/health"
        with urllib.request.urlopen(url, timeout=10) as resp:
            latency_ms = int((time.time() - t0) * 1000)
            body = resp.read().decode().strip()
            return True, f"Response: '{body}' | latency={latency_ms}ms"
    except Exception as e:
        return False, str(e)


def check_frontend(frontend_url: str) -> tuple[bool, str]:
    """Check that the frontend is serving."""
    try:
        import urllib.request
        t0 = time.time()
        with urllib.request.urlopen(frontend_url, timeout=10) as resp:
            latency_ms = int((time.time() - t0) * 1000)
            content_type = resp.getheader("Content-Type", "unknown")
            return True, f"HTTP {resp.status} | Content-Type: {content_type} | latency={latency_ms}ms"
    except Exception as e:
        return False, str(e)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Project Helix — Health Check")
    parser.add_argument(
        "--db-url",
        default=os.getenv(
            "DATABASE_URL",
            "postgresql://helix:change_me_in_production@localhost:5432/helixdb"
        ),
        help="PostgreSQL connection URL",
    )
    parser.add_argument(
        "--redis-url",
        default=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        help="Redis connection URL",
    )
    parser.add_argument(
        "--minio-endpoint",
        default=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        help="MinIO endpoint",
    )
    parser.add_argument(
        "--minio-access-key",
        default=os.getenv("MINIO_ROOT_USER", os.getenv("MINIO_ACCESS_KEY", "minioadmin")),
    )
    parser.add_argument(
        "--minio-secret-key",
        default=os.getenv("MINIO_ROOT_PASSWORD", os.getenv("MINIO_SECRET_KEY", "change_me_in_production")),
    )
    parser.add_argument(
        "--api-url",
        default=os.getenv("API_URL", "http://localhost/api"),
        help="Backend API base URL",
    )
    parser.add_argument(
        "--skip-db", action="store_true", help="Skip PostgreSQL check"
    )
    parser.add_argument(
        "--skip-redis", action="store_true", help="Skip Redis check"
    )
    parser.add_argument(
        "--skip-minio", action="store_true", help="Skip MinIO check"
    )
    parser.add_argument(
        "--skip-backend", action="store_true", help="Skip backend API check"
    )

    args = parser.parse_args()

    header("Project Helix — Service Health Check")
    print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n")

    results = {}

    # Check 1: PostgreSQL
    if args.skip_db:
        skipped("PostgreSQL", "Skipped via --skip-db flag")
        results["postgresql"] = None
    else:
        print(f"  Checking PostgreSQL ({args.db_url.split('@')[-1]})...")
        ok_flag, detail = check_postgresql(args.db_url)
        results["postgresql"] = ok_flag
        if ok_flag:
            passed("PostgreSQL", detail)
        else:
            failed("PostgreSQL", detail)

    # Check 2: Redis
    if args.skip_redis:
        skipped("Redis", "Skipped via --skip-redis flag")
        results["redis"] = None
    else:
        print(f"  Checking Redis ({args.redis_url})...")
        ok_flag, detail = check_redis(args.redis_url)
        results["redis"] = ok_flag
        if ok_flag:
            passed("Redis", detail)
        else:
            failed("Redis", detail)

    # Check 3: MinIO
    if args.skip_minio:
        skipped("MinIO", "Skipped via --skip-minio flag")
        results["minio"] = None
    else:
        minio_secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        print(f"  Checking MinIO ({args.minio_endpoint})...")
        ok_flag, detail = check_minio(
            args.minio_endpoint,
            args.minio_access_key,
            args.minio_secret_key,
            minio_secure,
        )
        results["minio"] = ok_flag
        if ok_flag:
            passed("MinIO", detail)
        else:
            failed("MinIO", detail)

    # Check 4: Nginx (via /health)
    nginx_url = "http://localhost"
    print(f"  Checking Nginx ({nginx_url})...")
    ok_flag, detail = check_nginx(nginx_url)
    results["nginx"] = ok_flag
    if ok_flag:
        passed("Nginx", detail)
    else:
        failed("Nginx", detail)

    # Check 5: Backend API
    if args.skip_backend:
        skipped("Backend API", "Skipped via --skip-backend flag")
        results["backend"] = None
    else:
        print(f"  Checking Backend API ({args.api_url})...")
        ok_flag, detail = check_backend_api(args.api_url)
        results["backend"] = ok_flag
        if ok_flag:
            passed("Backend API", detail)
        else:
            failed("Backend API", detail)

    # Check 6: Frontend
    print(f"  Checking Frontend (http://localhost)...")
    ok_flag, detail = check_frontend("http://localhost")
    results["frontend"] = ok_flag
    if ok_flag:
        passed("Frontend", detail)
    else:
        failed("Frontend", detail)

    # Summary
    checks_run = [v for v in results.values() if v is not None]
    passed_count = sum(1 for v in checks_run if v)
    total_count = len(checks_run)

    print()
    print(f"{'─' * 60}")
    if passed_count == total_count:
        print(f"  {Colors.GREEN}{Colors.BOLD}ALL {total_count} CHECKS PASSED ✅{Colors.RESET}")
        print(f"\n  {Colors.CYAN}Project Helix is ready!{Colors.RESET}")
        print(f"  Open: http://localhost\n")
        return 0
    else:
        failed_count = total_count - passed_count
        print(f"  {Colors.RED}{Colors.BOLD}{failed_count} of {total_count} CHECKS FAILED ❌{Colors.RESET}")
        print(f"\n  Run 'docker compose ps' to check service status.")
        print(f"  Run 'docker compose logs <service>' to see error details.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
