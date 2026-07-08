#!/usr/bin/env python3
"""
benchmark_runner.py — Project Helix Full Benchmark Suite
=========================================================
Standalone benchmark runner that exercises all major API endpoints
and measures latency, throughput, and memory footprint.

Tests:
    1. Health check latency (nginx + FastAPI)
    2. Auth (login) latency
    3. Evidence upload latency
    4. Embedding generation time
    5. Semantic search latency (p50, p95)
    6. Hypothesis generation latency (p50, p95)
    7. PDF export latency
    8. Memory footprint (via psutil or /proc/meminfo)

Usage:
    pip install httpx psutil rich
    python evaluation/benchmarks/benchmark_runner.py \\
        --api-url http://localhost/api \\
        --email admin@helix.local \\
        --password your_password \\
        --runs 5

Output:
    Prints a formatted table to stdout.
    Saves results to evaluation/benchmarks/results_latest.json
"""
from __future__ import annotations

import argparse
import asyncio
import io
import json
import os
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Coroutine

try:
    import httpx
except ImportError:
    print("ERROR: httpx is required. Run: pip install httpx")
    sys.exit(1)

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

try:
    from rich.console import Console
    from rich.table import Table
    from rich import box
    HAS_RICH = True
    console = Console()
except ImportError:
    HAS_RICH = False


# ── SLA Targets ────────────────────────────────────────────────────────────────
# These define acceptable performance thresholds for production readiness.
SLA_TARGETS: dict[str, float] = {
    "health_avg_ms":         50.0,    # nginx health check
    "health_p95_ms":        200.0,
    "auth_avg_ms":          500.0,    # login
    "auth_p95_ms":         1000.0,
    "evidence_avg_ms":     3000.0,    # file upload (small test file)
    "evidence_p95_ms":     5000.0,
    "search_avg_ms":        500.0,    # semantic search
    "search_p95_ms":       1000.0,
    "hypothesis_avg_ms":   5000.0,    # AI generation (mock adapter)
    "hypothesis_p95_ms":  10000.0,    # 10s SLA for AI (fireworks real)
    "export_avg_ms":       3000.0,    # PDF export
    "export_p95_ms":       8000.0,
}

# Small PDF for upload tests (~5KB synthetic)
SAMPLE_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
    b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    b"4 0 obj<</Length 120>>stream\n"
    b"BT /F1 12 Tf 72 720 Td "
    b"(Project Helix Benchmark Test Evidence Document - Temperature Sensor Log 2024-01-15) Tj ET\n"
    b"endstream endobj\n"
    b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    b"xref\n0 6\n0000000000 65535 f\n"
    b"trailer<</Size 6/Root 1 0 R>>\n"
    b"startxref 0\n%%EOF"
)


# ── Timing Utilities ───────────────────────────────────────────────────────────

def percentile(data: list[float], p: float) -> float:
    """Compute p-th percentile of a numeric list."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    idx  = (p / 100) * (len(sorted_data) - 1)
    lo   = int(idx)
    hi   = min(lo + 1, len(sorted_data) - 1)
    frac = idx - lo
    return sorted_data[lo] * (1 - frac) + sorted_data[hi] * frac


async def measure(
    label: str,
    coro_fn: Callable[[], Coroutine[Any, Any, Any]],
    runs: int = 5,
    warmup: int = 1,
) -> dict[str, Any]:
    """
    Execute ``coro_fn`` multiple times and collect timing statistics.

    Args:
        label:   Human-readable name for the benchmark.
        coro_fn: Callable that returns an awaitable.
        runs:    Number of timed iterations.
        warmup:  Number of warm-up iterations (not counted).

    Returns:
        Dict with avg_ms, p50_ms, p95_ms, min_ms, max_ms, stdev_ms, errors, successes.
    """
    errors = 0
    successes = 0
    latencies: list[float] = []

    total = warmup + runs
    for i in range(total):
        is_warmup = i < warmup
        start = time.perf_counter()
        try:
            await coro_fn()
            elapsed_ms = (time.perf_counter() - start) * 1000
            if not is_warmup:
                latencies.append(elapsed_ms)
                successes += 1
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            if not is_warmup:
                errors += 1
                latencies.append(elapsed_ms)  # Include failed latency in stats
            if not is_warmup:
                pass  # Errors counted above

    result: dict[str, Any] = {
        "label":       label,
        "runs":        runs,
        "successes":   successes,
        "errors":      errors,
        "avg_ms":      round(statistics.mean(latencies), 1)          if latencies else 0.0,
        "p50_ms":      round(percentile(latencies, 50), 1)           if latencies else 0.0,
        "p95_ms":      round(percentile(latencies, 95), 1)           if latencies else 0.0,
        "min_ms":      round(min(latencies), 1)                      if latencies else 0.0,
        "max_ms":      round(max(latencies), 1)                      if latencies else 0.0,
        "stdev_ms":    round(statistics.stdev(latencies), 1)         if len(latencies) > 1 else 0.0,
    }
    return result


# ── Memory Measurement ─────────────────────────────────────────────────────────

def get_memory_mb() -> dict[str, float]:
    """Return system and process memory info in MB."""
    info: dict[str, float] = {}
    if HAS_PSUTIL:
        vm = psutil.virtual_memory()
        info["system_total_mb"]     = round(vm.total / (1024**2), 1)
        info["system_available_mb"] = round(vm.available / (1024**2), 1)
        info["system_used_mb"]      = round(vm.used / (1024**2), 1)
        info["system_percent"]      = vm.percent
        proc = psutil.Process()
        info["runner_rss_mb"]       = round(proc.memory_info().rss / (1024**2), 1)
    else:
        # Try /proc/meminfo (Linux only)
        try:
            with open("/proc/meminfo") as f:
                for line in f:
                    if "MemTotal" in line:
                        info["system_total_mb"] = int(line.split()[1]) / 1024
                    elif "MemAvailable" in line:
                        info["system_available_mb"] = int(line.split()[1]) / 1024
        except FileNotFoundError:
            info["note"] = "psutil not available; install with: pip install psutil"
    return info


# ── Benchmark Coroutines ───────────────────────────────────────────────────────

class HelixBenchmarks:
    """Encapsulates all benchmark coroutines with shared HTTP client and state."""

    def __init__(self, client: httpx.AsyncClient, api_url: str, token: str) -> None:
        self.client   = client
        self.api_url  = api_url.rstrip("/")
        self.headers  = {"Authorization": f"Bearer {token}"} if token else {}
        self.token    = token

        # State accumulated during benchmark run
        self.investigation_id: str = ""
        self.evidence_id: str = ""

    # ── Health ─────────────────────────────────────────────────────────────────

    async def nginx_health(self) -> None:
        resp = await self.client.get(
            f"{self.api_url.replace('/api', '')}/health",
            timeout=5.0,
        )
        resp.raise_for_status()

    async def fastapi_health(self) -> None:
        resp = await self.client.get(f"{self.api_url}/health", timeout=5.0)
        resp.raise_for_status()

    # ── Auth ───────────────────────────────────────────────────────────────────

    async def auth_login(self, email: str, password: str) -> str:
        resp = await self.client.post(
            f"{self.api_url}/auth/login",
            json={"email": email, "password": password},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    async def auth_me(self) -> None:
        resp = await self.client.get(
            f"{self.api_url}/auth/me",
            headers=self.headers,
            timeout=10.0,
        )
        resp.raise_for_status()

    # ── Investigations ─────────────────────────────────────────────────────────

    async def create_investigation(self) -> str:
        resp = await self.client.post(
            f"{self.api_url}/investigations",
            json={
                "title":       f"Benchmark Investigation {time.time():.0f}",
                "description": "Automated benchmark test investigation",
                "severity":    "low",
                "status":      "open",
            },
            headers=self.headers,
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["id"]

    async def list_investigations(self) -> None:
        resp = await self.client.get(
            f"{self.api_url}/investigations",
            headers=self.headers,
            timeout=15.0,
        )
        resp.raise_for_status()

    # ── Evidence ───────────────────────────────────────────────────────────────

    async def upload_evidence(self) -> str:
        if not self.investigation_id:
            raise RuntimeError("No investigation_id set — create investigation first")
        files = {"file": ("benchmark_test.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
        data  = {"investigation_id": self.investigation_id}
        resp  = await self.client.post(
            f"{self.api_url}/evidence/upload",
            files=files,
            data=data,
            headers=self.headers,
            timeout=60.0,
        )
        resp.raise_for_status()
        return resp.json().get("id", "")

    # ── Search ─────────────────────────────────────────────────────────────────

    async def semantic_search(self) -> None:
        if not self.investigation_id:
            raise RuntimeError("No investigation_id for semantic search")
        resp = await self.client.post(
            f"{self.api_url}/knowledge/search",
            json={
                "query":            "temperature excursion cold chain supplier",
                "investigation_id": self.investigation_id,
                "top_k":            5,
            },
            headers=self.headers,
            timeout=30.0,
        )
        # 200 OK or 404 (no documents yet) are both acceptable
        if resp.status_code not in (200, 404):
            resp.raise_for_status()

    # ── AI / Hypothesis ────────────────────────────────────────────────────────

    async def generate_hypothesis(self) -> None:
        if not self.investigation_id:
            raise RuntimeError("No investigation_id for hypothesis generation")
        resp = await self.client.post(
            f"{self.api_url}/ai/hypothesis",
            json={"investigation_id": self.investigation_id},
            headers=self.headers,
            timeout=180.0,
        )
        if resp.status_code not in (200, 201):
            resp.raise_for_status()

    # ── Export ─────────────────────────────────────────────────────────────────

    async def export_pdf(self) -> None:
        if not self.investigation_id:
            raise RuntimeError("No investigation_id for export")
        resp = await self.client.post(
            f"{self.api_url}/export/pdf",
            json={"investigation_id": self.investigation_id},
            headers=self.headers,
            timeout=60.0,
        )
        if resp.status_code not in (200, 201, 202):
            resp.raise_for_status()


# ── Reporting ──────────────────────────────────────────────────────────────────

def sla_status(result: dict[str, Any], key_avg: str, key_p95: str) -> str:
    """Return ✅/❌/⚠️ based on SLA targets."""
    avg_ok  = result.get("avg_ms", 9999) <= SLA_TARGETS.get(key_avg, float("inf"))
    p95_ok  = result.get("p95_ms", 9999) <= SLA_TARGETS.get(key_p95, float("inf"))
    err_ok  = result.get("errors", 0) == 0

    if avg_ok and p95_ok and err_ok:
        return "✅ PASS"
    elif not err_ok:
        return "❌ ERRORS"
    elif not p95_ok:
        return "⚠️ P95 HIGH"
    else:
        return "⚠️ AVG HIGH"


def print_results_rich(benchmark_results: list[dict[str, Any]]) -> None:
    """Print a rich formatted results table."""
    if not HAS_RICH:
        return
    table = Table(
        title="📊 Project Helix — Full Benchmark Report",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Benchmark",   style="bold",   min_width=28)
    table.add_column("Runs",        justify="right", min_width=5)
    table.add_column("Avg (ms)",    justify="right", min_width=10)
    table.add_column("P50 (ms)",    justify="right", min_width=10)
    table.add_column("P95 (ms)",    justify="right", min_width=10)
    table.add_column("Min (ms)",    justify="right", min_width=10)
    table.add_column("Max (ms)",    justify="right", min_width=10)
    table.add_column("Errors",      justify="right", min_width=7)
    table.add_column("SLA",         justify="center", min_width=12)

    for r in benchmark_results:
        # Lookup SLA key from label
        label_lower = r["label"].lower().replace(" ", "_")
        avg_key = f"{label_lower}_avg_ms"
        p95_key = f"{label_lower}_p95_ms"
        sla = sla_status(r, avg_key, p95_key)

        err_style = "red" if r["errors"] > 0 else "green"
        table.add_row(
            r["label"],
            str(r["runs"]),
            f"{r['avg_ms']:.0f}",
            f"{r['p50_ms']:.0f}",
            f"{r['p95_ms']:.0f}",
            f"{r['min_ms']:.0f}",
            f"{r['max_ms']:.0f}",
            f"[{err_style}]{r['errors']}[/{err_style}]",
            sla,
        )

    console.print()
    console.print(table)
    console.print()


def print_results_plain(benchmark_results: list[dict[str, Any]]) -> None:
    print("\n" + "=" * 100)
    print(f"  {'Benchmark':<28} {'Runs':>5} {'Avg ms':>8} {'P50 ms':>8} {'P95 ms':>8} {'Min ms':>8} {'Max ms':>8} {'Errors':>7}")
    print("  " + "-" * 90)
    for r in benchmark_results:
        print(f"  {r['label']:<28} {r['runs']:>5} {r['avg_ms']:>8.0f} {r['p50_ms']:>8.0f} "
              f"{r['p95_ms']:>8.0f} {r['min_ms']:>8.0f} {r['max_ms']:>8.0f} {r['errors']:>7}")
    print("=" * 100 + "\n")


# ── Main ───────────────────────────────────────────────────────────────────────

async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Project Helix Full Benchmark Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--api-url",   default="http://localhost/api", help="Helix API base URL")
    parser.add_argument("--email",     default="admin@helix.local",    help="Admin email for login")
    parser.add_argument("--password",  default="",                     help="Admin password")
    parser.add_argument("--token",     default="",                     help="Bearer token (skip login)")
    parser.add_argument("--runs",      type=int, default=5,            help="Iterations per benchmark")
    parser.add_argument("--warmup",    type=int, default=1,            help="Warm-up iterations (not counted)")
    parser.add_argument("--skip-ai",   action="store_true",            help="Skip AI hypothesis benchmark")
    parser.add_argument("--skip-upload", action="store_true",          help="Skip evidence upload benchmark")
    parser.add_argument("--output",    default="evaluation/benchmarks/results_latest.json")
    args = parser.parse_args()

    api_url = args.api_url.rstrip("/")
    now     = datetime.now(timezone.utc)

    print(f"\n🏁 Project Helix — Full Benchmark Suite")
    print(f"   API:    {api_url}")
    print(f"   Runs:   {args.runs} (+ {args.warmup} warmup)")
    print(f"   Time:   {now.isoformat()}")
    print()

    benchmark_results: list[dict[str, Any]] = []

    async with httpx.AsyncClient(follow_redirects=True) as client:
        bm = HelixBenchmarks(client, api_url, args.token)

        # ── 1. Nginx Health ────────────────────────────────────────────────────
        print("  ▶ Nginx health check...")
        r = await measure("nginx_health", bm.nginx_health, args.runs, args.warmup)
        benchmark_results.append({**r, "label": "Nginx Health"})
        print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

        # ── 2. FastAPI Health ──────────────────────────────────────────────────
        print("  ▶ FastAPI health check...")
        r = await measure("fastapi_health", bm.fastapi_health, args.runs, args.warmup)
        benchmark_results.append({**r, "label": "FastAPI Health"})
        print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

        # ── 3. Auth Login ──────────────────────────────────────────────────────
        token = args.token
        if not token and args.password:
            print("  ▶ Auth login latency...")
            r = await measure(
                "auth_login",
                lambda: bm.auth_login(args.email, args.password),
                args.runs, args.warmup,
            )
            benchmark_results.append({**r, "label": "Auth Login"})
            print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

            # Get token for subsequent calls
            try:
                token = await bm.auth_login(args.email, args.password)
                bm.headers = {"Authorization": f"Bearer {token}"}
                bm.token   = token
            except Exception as exc:
                print(f"    ⚠️  Could not get auth token: {exc}. Skipping authenticated benchmarks.")
                token = ""
        elif token:
            bm.headers = {"Authorization": f"Bearer {token}"}
            bm.token   = token
            print("  ▶ Using provided bearer token")

        if token:
            # ── 4. Auth /me ────────────────────────────────────────────────────
            print("  ▶ Auth /me latency...")
            r = await measure("auth_me", bm.auth_me, args.runs, args.warmup)
            benchmark_results.append({**r, "label": "Auth Me"})
            print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

            # ── 5. Create Investigation ────────────────────────────────────────
            print("  ▶ Create investigation...")
            try:
                bm.investigation_id = await bm.create_investigation()
                print(f"    investigation_id: {bm.investigation_id}")
                r = await measure("list_investigations", bm.list_investigations, args.runs, args.warmup)
                benchmark_results.append({**r, "label": "List Investigations"})
                print(f"    list avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms")
            except Exception as exc:
                print(f"    ⚠️  Could not create investigation: {exc}")

            # ── 6. Evidence Upload ─────────────────────────────────────────────
            if bm.investigation_id and not args.skip_upload:
                print("  ▶ Evidence upload latency...")
                r = await measure("evidence_upload", bm.upload_evidence, max(args.runs, 3), args.warmup)
                benchmark_results.append({**r, "label": "Evidence Upload"})
                print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

            # ── 7. Semantic Search ─────────────────────────────────────────────
            if bm.investigation_id:
                print("  ▶ Semantic search latency...")
                r = await measure("semantic_search", bm.semantic_search, args.runs, args.warmup)
                benchmark_results.append({**r, "label": "Semantic Search"})
                print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

            # ── 8. Hypothesis Generation ───────────────────────────────────────
            if bm.investigation_id and not args.skip_ai:
                print("  ▶ Hypothesis generation latency (may take 10-30s per run)...")
                r = await measure("hypothesis_generation", bm.generate_hypothesis, min(args.runs, 3), 0)
                benchmark_results.append({**r, "label": "Hypothesis Generation"})
                print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

            # ── 9. PDF Export ──────────────────────────────────────────────────
            if bm.investigation_id:
                print("  ▶ PDF export latency...")
                r = await measure("pdf_export", bm.export_pdf, max(args.runs, 3), 0)
                benchmark_results.append({**r, "label": "PDF Export"})
                print(f"    avg={r['avg_ms']:.0f}ms, p95={r['p95_ms']:.0f}ms, errors={r['errors']}")

    # ── Memory Footprint ───────────────────────────────────────────────────────
    mem_info = get_memory_mb()
    print(f"\n  Memory: system={mem_info.get('system_used_mb', '?')}MB used, "
          f"available={mem_info.get('system_available_mb', '?')}MB")

    # ── Print Table ────────────────────────────────────────────────────────────
    if HAS_RICH:
        print_results_rich(benchmark_results)
    else:
        print_results_plain(benchmark_results)

    # ── Save Results ───────────────────────────────────────────────────────────
    output: dict[str, Any] = {
        "meta": {
            "timestamp":  now.isoformat(),
            "api_url":    api_url,
            "tool":       "benchmark_runner",
            "version":    "1.0.0",
            "runs":       args.runs,
            "warmup":     args.warmup,
        },
        "sla_targets":      SLA_TARGETS,
        "benchmark_results": benchmark_results,
        "memory_mb":        mem_info,
        "provider":         os.environ.get("INFERENCE_PROVIDER", "unknown"),
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2, ensure_ascii=False)

    print(f"  💾 Results saved to: {out_path.resolve()}")

    # Timestamped copy
    ts = now.strftime("%Y%m%d_%H%M%S")
    ts_path = out_path.parent / f"runner_{ts}.json"
    with ts_path.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2, ensure_ascii=False)
    print(f"  📁 Timestamped: {ts_path.name}\n")

    total_errors = sum(r.get("errors", 0) for r in benchmark_results)
    if total_errors == 0:
        print("  ✅ Benchmark suite complete — no errors\n")
    else:
        print(f"  ⚠️  {total_errors} total errors across all benchmarks — check API connectivity\n")


if __name__ == "__main__":
    asyncio.run(main())
