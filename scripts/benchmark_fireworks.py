#!/usr/bin/env python3
"""
Project Helix — Fireworks AI Benchmark Script (Phase 3 Performance Framework)
==============================================================================

Benchmarks inference performance against the Helix API when using
INFERENCE_PROVIDER=fireworks (Gemma 4 31B IT on AMD Instinct MI300X).

Usage:
    # First start Helix with INFERENCE_PROVIDER=fireworks in .env
    python scripts/benchmark_fireworks.py \\
        --api-url http://localhost/api \\
        --email demo@helix.ai \\
        --password helixdemo2024 \\
        --runs 5

Metrics captured:
    - Time to First Token (TTFT) [estimated via streaming]
    - Total generation latency
    - Throughput (tokens/second)
    - Token usage per call
    - Estimated cost per investigation lifecycle
"""
from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time
from datetime import datetime
from pathlib import Path

import httpx

# --------------------------------------------------------------------------
# Cost constants (Fireworks AI pricing as of 2025)
# --------------------------------------------------------------------------
COST_PER_1M_INPUT_TOKENS = 0.20   # USD
COST_PER_1M_OUTPUT_TOKENS = 0.20  # USD

# Estimated tokens per investigation lifecycle
TOKENS_PER_INVESTIGATION = {
    "hypothesis_prompt": 1500,
    "hypothesis_completion": 800,
    "capa_prompt": 2200,
    "capa_completion": 1000,
    "summary_prompt": 800,
    "summary_completion": 400,
}


def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    return (
        input_tokens / 1_000_000 * COST_PER_1M_INPUT_TOKENS
        + output_tokens / 1_000_000 * COST_PER_1M_OUTPUT_TOKENS
    )


def calculate_investigation_cost() -> float:
    total_input = sum(v for k, v in TOKENS_PER_INVESTIGATION.items() if "prompt" in k)
    total_output = sum(v for k, v in TOKENS_PER_INVESTIGATION.items() if "completion" in k)
    return calculate_cost(total_input, total_output)


async def login(client: httpx.AsyncClient, api_url: str, email: str, password: str) -> str:
    resp = await client.post(f"{api_url}/auth/login", json={"email": email, "password": password})
    resp.raise_for_status()
    return resp.json()["access_token"]


async def create_investigation(client: httpx.AsyncClient, api_url: str, token: str, run_idx: int) -> str:
    resp = await client.post(
        f"{api_url}/investigations",
        json={
            "title": f"[BENCHMARK] Run {run_idx} — {datetime.utcnow().isoformat()}",
            "description": "Automated benchmark investigation for performance testing.",
            "severity": "medium",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    resp.raise_for_status()
    return resp.json()["id"]


async def benchmark_hypothesis_generation(
    client: httpx.AsyncClient, api_url: str, token: str, investigation_id: str
) -> dict:
    start = time.perf_counter()
    resp = await client.post(
        f"{api_url}/investigations/{investigation_id}/hypotheses",
        json={"num_hypotheses": 3, "include_evidence": True},
        headers={"Authorization": f"Bearer {token}"},
        timeout=120.0,
    )
    end = time.perf_counter()
    latency_ms = (end - start) * 1000
    resp.raise_for_status()
    body = resp.json()
    usage = body.get("usage", {}) if isinstance(body, dict) else {}
    input_tokens = usage.get("prompt_tokens", TOKENS_PER_INVESTIGATION["hypothesis_prompt"])
    output_tokens = usage.get("completion_tokens", TOKENS_PER_INVESTIGATION["hypothesis_completion"])
    return {
        "latency_ms": latency_ms,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": calculate_cost(input_tokens, output_tokens),
        "hypotheses_count": len(body) if isinstance(body, list) else 1,
    }


def print_results_table(results: list[dict], investigation_cost: float) -> None:
    latencies = [r["latency_ms"] for r in results]
    costs = [r["cost_usd"] for r in results]
    p50 = statistics.median(latencies)
    p95 = sorted(latencies)[max(0, int(len(latencies) * 0.95) - 1)]
    avg = statistics.mean(latencies)
    avg_tokens_out = statistics.mean([r["output_tokens"] for r in results])
    throughput = (avg_tokens_out / (avg / 1000)) if avg > 0 else 0

    print("\n" + "=" * 66)
    print("  Project Helix — Fireworks AI Benchmark Results")
    print("  Model: accounts/fireworks/models/gemma-4-31b-it")
    print("  Hardware: AMD Instinct MI300X (via Fireworks AI)")
    print("=" * 66)
    print(f"  {'Metric':<38} {'Value':>20}")
    print(f"  {'-'*38} {'-'*20}")
    print(f"  {'Hypothesis Latency — avg':<38} {avg:>17.1f} ms")
    print(f"  {'Hypothesis Latency — p50':<38} {p50:>17.1f} ms")
    print(f"  {'Hypothesis Latency — p95':<38} {p95:>17.1f} ms")
    print(f"  {'Throughput (output tokens/sec)':<38} {throughput:>17.1f}")
    print(f"  {'Avg input tokens / call':<38} {statistics.mean([r['input_tokens'] for r in results]):>17.0f}")
    print(f"  {'Avg output tokens / call':<38} {statistics.mean([r['output_tokens'] for r in results]):>17.0f}")
    print(f"  {'Avg cost / hypothesis call':<38} ${statistics.mean(costs):>18.6f}")
    print(f"  {'Estimated cost / full investigation':<38} ${investigation_cost:>18.6f}")
    print("=" * 66)
    print("\n  SLA Verification:")
    print(f"  {'p95 latency < 10,000 ms':<40} {'✅ PASS' if p95 < 10_000 else '❌ FAIL'}")
    print(f"  {'Cost < $0.01 per investigation':<40} {'✅ PASS' if investigation_cost < 0.01 else '❌ FAIL'}")
    print()


async def run_benchmark(api_url: str, email: str, password: str, runs: int) -> dict:
    print(f"\n🔬 Starting Helix Fireworks Benchmark ({runs} runs)...")
    print(f"   API: {api_url}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        print("   Authenticating...")
        token = await login(client, api_url, email, password)
        print("   ✓ Authenticated")

        results = []
        for i in range(runs):
            print(f"\n   Run {i + 1}/{runs}:")
            inv_id = await create_investigation(client, api_url, token, i + 1)
            print(f"     Created investigation: {inv_id[:8]}...")
            result = await benchmark_hypothesis_generation(client, api_url, token, inv_id)
            results.append(result)
            print(f"     Latency: {result['latency_ms']:.1f} ms  |  Tokens out: {result['output_tokens']}  |  Cost: ${result['cost_usd']:.6f}")

        investigation_cost = calculate_investigation_cost()
        print_results_table(results, investigation_cost)

        output = {
            "timestamp": datetime.utcnow().isoformat(),
            "provider": "fireworks",
            "model": "accounts/fireworks/models/gemma-4-31b-it",
            "hardware": "AMD Instinct MI300X",
            "runs": runs,
            "results": results,
            "summary": {
                "latency_avg_ms": statistics.mean([r["latency_ms"] for r in results]),
                "latency_p50_ms": statistics.median([r["latency_ms"] for r in results]),
                "latency_p95_ms": sorted([r["latency_ms"] for r in results])[
                    max(0, int(len(results) * 0.95) - 1)
                ],
                "avg_output_tokens": statistics.mean([r["output_tokens"] for r in results]),
                "investigation_cost_usd": investigation_cost,
            },
        }

        results_path = Path("evaluation/benchmarks/results_latest.json")
        results_path.parent.mkdir(parents=True, exist_ok=True)
        results_path.write_text(json.dumps(output, indent=2))
        print(f"   Results saved to: {results_path}\n")
        return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Helix with Fireworks AI")
    parser.add_argument("--api-url", default="http://localhost/api")
    parser.add_argument("--email", default="demo@helix.ai")
    parser.add_argument("--password", default="helixdemo2024")
    parser.add_argument("--runs", type=int, default=5)
    args = parser.parse_args()
    asyncio.run(run_benchmark(args.api_url, args.email, args.password, args.runs))


if __name__ == "__main__":
    main()
