#!/usr/bin/env python3
"""Project Helix — System Integration Verification Script (with Live Fireworks AI).

Systematically validates all 13 core workflows of the MVP stack against a live
Fireworks AI model (deepseek-v4-pro) on AMD MI300X, collecting latencies and response payloads.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
import uuid

# Set Python path to backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# Helper to load values from .env file
def get_env_value(key: str, default: str = "") -> str:
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip() == key:
                        return v.strip().strip("'").strip('"')
    return default

# Override settings for Live Fireworks verification
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///test_verify_fireworks.db"
os.environ["INFERENCE_PROVIDER"] = "fireworks"
os.environ["FIREWORKS_API_KEY"] = get_env_value("FIREWORKS_API_KEY")
os.environ["FIREWORKS_MODEL"] = get_env_value("FIREWORKS_MODEL") or "accounts/fireworks/models/gemma-4-31b-it"
os.environ["EMBEDDING_PROVIDER"] = "local"
os.environ["SECRET_KEY"] = "verification-testing-secret-key-32-chars"
os.environ["AUDIT_ENABLED"] = "true"

# Monkeypatch storage before main import to skip MinIO network calls
import src.core.storage

async def mock_ensure_buckets():
    pass

async def mock_upload_file(bucket, object_name, data, content_type="application/octet-stream", length=-1):
    return object_name

async def mock_download_file(bucket, object_name):
    # Returns some mock text bytes
    return b"Filter bubble point integrity test passed for FIL-022-A."

async def mock_get_presigned_url(bucket, object_name, expires_seconds=3600):
    return f"http://mock-minio/{bucket}/{object_name}"

src.core.storage.ensure_buckets = mock_ensure_buckets
src.core.storage.upload_file = mock_upload_file
src.core.storage.download_file = mock_download_file
src.core.storage.get_presigned_url = mock_get_presigned_url

from fastapi.testclient import TestClient
from sqlalchemy import text
from src.core.database import Base, engine
from src.main import app

client = TestClient(app)

class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def print_header(name: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.BLUE}[VERIFYING] {name}{Colors.RESET}")


def print_result(name: str, passed: bool, latency: float, payload: dict | None = None) -> None:
    status_str = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
    print(f"  {Colors.BOLD}{name}: {status_str} (latency: {latency:.2f}ms){Colors.RESET}")
    if payload:
        import pprint
        print("  Payload Snippet:")
        pprint.pprint(payload, indent=4, width=80, depth=2)


async def setup_db() -> None:
    if not str(engine.url).startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    else:
        async with engine.begin() as conn:
            await conn.execute(text("PRAGMA journal_mode=WAL;"))
            await conn.execute(text("PRAGMA busy_timeout=30000;"))
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def test_runner() -> None:
    print(f"{Colors.BOLD}{Colors.BLUE}============================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  Project Helix Verification & Readiness Suite — RC4 Live   {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}============================================================{Colors.RESET}")

    results = {}
    auth_headers = {}

    # 1. Login/Register Workflow
    print_header("1. Login & Registration Flow")
    start = time.perf_counter()
    reg_payload = {
        "email": "analyst@apex.ai",
        "password": "SecurePassword123",
        "full_name": "Jennifer Martinez",
        "org_name": "Apex Precision Mfg",
        "org_slug": "apex-precision"
    }
    r = client.post("/api/auth/register", json=reg_payload)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "access_token" in r.json()
    print_result("Registration / Org creation", passed, latency, r.json() if passed else None)
    results["registration"] = passed
    
    if passed:
        auth_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # 2. Create Investigation
    print_header("2. Create Investigation Workflow")
    start = time.perf_counter()
    inv_payload = {
        "title": "Batch #2847 — Sterility Failure",
        "description": "Burkholderia cepacia complex contamination suspected on Filling Line 3.",
        "severity": "critical"
    }
    r = client.post("/api/investigations", json=inv_payload, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "id" in r.json()
    print_result("Create Investigation", passed, latency, r.json() if passed else None)
    results["create_investigation"] = passed
    investigation_id = r.json().get("id") if passed else None

    # 3. Bind Physical Assets
    print_header("3. Ingest / Bind Physical Assets")
    start = time.perf_counter()
    asset_payload = {
        "asset_type": "machine",
        "asset_code": "FIL-022-A",
        "name": "0.22 Micron Sterile Filter Housing",
        "metadata_": {"pore_size": 0.22}
    }
    r = client.post("/api/assets", json=asset_payload, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "id" in r.json()
    print_result("Bind Asset", passed, latency, r.json() if passed else None)
    results["bind_asset"] = passed

    # 4. Upload Evidence (MinIO)
    print_header("4. Evidence Upload API Endpoint Check")
    start = time.perf_counter()
    from io import BytesIO
    files = {"file": ("filter_report.txt", BytesIO(b"Filter bubble point integrity test passed for FIL-022-A."), "text/plain")}
    data = {"investigation_id": investigation_id}
    r = client.post("/api/evidence/upload", files=files, data=data, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "id" in r.json()
    print_result("Upload Evidence", passed, latency, r.json() if passed else None)
    results["upload_evidence"] = passed
    evidence_id = r.json().get("id") if passed else None

    if passed and evidence_id:
        from src.evidence.processor import process_evidence_item
        asyncio.run(process_evidence_item(uuid.UUID(evidence_id)))

    # 5. Local Document Parser Adapter
    print_header("5. Local Document Parser Adapter")
    start = time.perf_counter()
    from src.evidence.document_adapter import get_adapter
    adapter = get_adapter("text/plain", "filter_report.txt")
    text_content, meta = adapter.extract(b"Filter bubble point integrity test passed for FIL-022-A.", "filter_report.txt")
    latency = (time.perf_counter() - start) * 1000.0
    passed = "bubble point" in text_content and meta is not None
    print_result("Plain text adapter parser", passed, latency, {"text": text_content[:50], "meta": meta})
    results["document_adapter"] = passed

    # 6. SentenceTransformers Local Embeddings
    print_header("6. SentenceTransformers Local Embeddings")
    start = time.perf_counter()
    from src.ai_runtime.adapters.embedding_adapter import get_embedding_adapter
    emb_adapter = get_embedding_adapter()
    v = asyncio.run(emb_adapter.embed_batch(["Filter bubble point integrity test passed for FIL-022-A."]))
    latency = (time.perf_counter() - start) * 1000.0
    passed = len(v) == 1 and len(v[0]) == 384
    print_result("Local Embedding generation (all-MiniLM-L6-v2)", passed, latency, {"dimension": len(v[0]) if passed else 0})
    results["embedding_generation"] = passed

    # 7. Semantic Vector Search Routing
    print_header("7. Semantic Vector Search Routing")
    start = time.perf_counter()
    search_payload = {
        "query": "bubble point test",
        "top_k": 3,
        "source_types": ["evidence"]
    }
    r = client.post("/api/search", json=search_payload, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 200
    print_result("Vector Search route check", passed, latency, r.json() if passed else None)
    results["semantic_search"] = passed

    # 8 & 9. RAG AI Hypothesis Generation (Live Fireworks AI Call)
    print_header("8 & 9. RAG AI Hypothesis Generation")
    start = time.perf_counter()
    hyp_payload = {"num_hypotheses": 1}
    r = client.post(f"/api/investigations/{investigation_id}/hypotheses", json=hyp_payload, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and len(r.json()) > 0
    print_result("AI Hypothesis workflow", passed, latency, r.json() if passed else None)
    results["hypothesis_generation"] = passed
    
    hypothesis_id = None
    if passed and len(r.json()) > 0:
        hypothesis_id = r.json()[0]["id"]
        # Accept the hypothesis to enable CAPA generation
        client.patch(f"/api/hypotheses/{hypothesis_id}", json={"status": "accepted"}, headers=auth_headers)

    # 10. CAPA Generation (Live Fireworks AI Call)
    print_header("10. Corrective and Preventive Actions (CAPA)")
    start = time.perf_counter()
    capa_payload = {"org_context": "Strict FDA guideline check."}
    r = client.post(f"/api/investigations/{investigation_id}/capa", json=capa_payload, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "content" in r.json()
    print_result("AI CAPA generation workflow", passed, latency, r.json() if passed else None)
    results["capa_generation"] = passed
    capa_id = r.json().get("id") if passed else None

    # 11. CAPA Approval & Closed-loop Capture
    print_header("11. CAPA Approval & Closed-loop Capture")
    start = time.perf_counter()
    r = client.post(f"/api/capa/{capa_id}/approve", json={"approved": True}, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 200 and r.json().get("status") == "approved"
    
    # Check if investigation is closed
    r_inv = client.get(f"/api/investigations/{investigation_id}", headers=auth_headers)
    is_closed = r_inv.json().get("status") == "closed"
    print(f"  Closed-loop check: Investigation closed automatically: {is_closed}")
    results["approval_workflow"] = passed and is_closed

    # 12. Timeline & Audit Trail
    print_header("12. Timeline & Audit Trail")
    start = time.perf_counter()
    r = client.get(f"/api/investigations/{investigation_id}/timeline", headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 200 and "events" in r.json()
    print_result("Audit Trail retrieval", passed, latency, r.json() if passed else None)
    results["audit_trail"] = passed

    # 13. PDF Report Export
    print_header("13. PDF Document Export compiling")
    start = time.perf_counter()
    r = client.post(f"/api/investigations/{investigation_id}/export", json={"format": "pdf"}, headers=auth_headers)
    latency = (time.perf_counter() - start) * 1000.0
    passed = r.status_code == 201 and "storage_key" in r.json()
    print_result("Report PDF compilation and fallback check", passed, latency, r.json() if passed else None)
    results["pdf_export"] = passed

    print(f"\n{Colors.BOLD}{Colors.BLUE}============================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  Helix System Integration Testing Summary                  {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}============================================================{Colors.RESET}")
    total_passed = sum(1 for v in results.values() if v)
    total_tests = len(results)
    print(f"  {Colors.BOLD}Verification Results: {total_passed} / {total_tests} Passed{Colors.RESET}")
    for k, v in results.items():
        st = f"{Colors.GREEN}PASS{Colors.RESET}" if v else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"    - {k:<25}: {st}")
    
    if total_passed == total_tests:
        print(f"\n{Colors.BOLD}{Colors.GREEN}  [SUCCESS] Helix Release Candidate 4 is READY FOR DEPLOYMENT!{Colors.RESET}")
        sys.exit(0)
    else:
        print(f"\n{Colors.BOLD}{Colors.RED}  [FAILURE] Release Candidate 4 has failed live Fireworks validation.{Colors.RESET}")
        sys.exit(1)


def main() -> None:
    # Clean database file if left over from prior failed run
    for f in ["test_verify_fireworks.db", "test_verify_fireworks.db-shm", "test_verify_fireworks.db-wal"]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
    asyncio.run(setup_db())
    try:
        test_runner()
    finally:
        for f in ["test_verify_fireworks.db", "test_verify_fireworks.db-shm", "test_verify_fireworks.db-wal"]:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass


if __name__ == "__main__":
    main()
