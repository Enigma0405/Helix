#!/usr/bin/env python3
"""
performance_report.py — Project Helix Performance Report Generator
====================================================================
Reads results_latest.json (from benchmark_runner.py and/or
benchmark_fireworks.py) and generates a formatted markdown report with:

    - Summary table of all benchmarks
    - Pass/Fail against SLA targets
    - Cost analysis (Fireworks AI Gemma 4 31B IT)
    - Side-by-side comparison: mock vs fireworks (when both results available)

Usage:
    python evaluation/benchmarks/performance_report.py
    python evaluation/benchmarks/performance_report.py \\
        --runner-results evaluation/benchmarks/results_latest.json \\
        --fireworks-results evaluation/benchmarks/results_fireworks_latest.json \\
        --output evaluation/benchmarks/performance_report.md

Output:
    Prints markdown to stdout.
    Saves markdown to evaluation/benchmarks/performance_report.md
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# ── SLA Targets (mirror of benchmark_runner.py) ────────────────────────────────
SLA_TARGETS: dict[str, float] = {
    "nginx_health_avg_ms":        50.0,
    "nginx_health_p95_ms":       200.0,
    "fastapi_health_avg_ms":      80.0,
    "fastapi_health_p95_ms":     300.0,
    "auth_login_avg_ms":         500.0,
    "auth_login_p95_ms":        1000.0,
    "auth_me_avg_ms":            200.0,
    "auth_me_p95_ms":            500.0,
    "list_investigations_avg_ms": 300.0,
    "list_investigations_p95_ms": 600.0,
    "evidence_upload_avg_ms":   3000.0,
    "evidence_upload_p95_ms":   5000.0,
    "semantic_search_avg_ms":    500.0,
    "semantic_search_p95_ms":   1000.0,
    "hypothesis_generation_avg_ms": 5000.0,
    "hypothesis_generation_p95_ms": 10000.0,
    "pdf_export_avg_ms":        3000.0,
    "pdf_export_p95_ms":        8000.0,
    # Fireworks-specific
    "ttft_avg_ms":              3000.0,
    "ttft_p95_ms":              5000.0,
    "tokens_per_sec_min":         10.0,
}

# Cost model (Fireworks AI, April 2026)
COST_PER_M_INPUT  = 0.20   # USD per million input tokens
COST_PER_M_OUTPUT = 0.20   # USD per million output tokens


# ── Utilities ──────────────────────────────────────────────────────────────────

def load_json(path: str | Path) -> dict[str, Any] | None:
    """Load JSON from path, return None if missing."""
    p = Path(path)
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def sla_icon(value: float, target: float, lower_is_better: bool = True) -> str:
    """Return ✅/❌ icon based on SLA comparison."""
    if lower_is_better:
        return "✅" if value <= target else "❌"
    return "✅" if value >= target else "❌"


def fmt_ms(value: float) -> str:
    """Format milliseconds with appropriate unit."""
    if value >= 1000:
        return f"{value/1000:.2f}s"
    return f"{value:.0f}ms"


def fmt_cost(value: float) -> str:
    """Format USD cost."""
    if value < 0.001:
        return f"${value:.6f}"
    return f"${value:.4f}"


# ── Report Sections ────────────────────────────────────────────────────────────

def build_header(runner_data: dict | None, fireworks_data: dict | None) -> str:
    """Build report header with metadata."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Project Helix — Performance Report",
        "",
        "> **EvidenceOps Platform | AMD Unicorn Hackathon**",
        "> Model: `accounts/fireworks/models/gemma-4-31b-it` on AMD Instinct MI300X",
        "",
        f"**Generated:** {now}  ",
    ]

    if runner_data:
        meta = runner_data.get("meta", {})
        lines.append(f"**API URL:** `{meta.get('api_url', 'N/A')}`  ")
        lines.append(f"**Runner Timestamp:** `{meta.get('timestamp', 'N/A')}`  ")
        lines.append(f"**Runs per benchmark:** {meta.get('runs', 'N/A')}  ")
        lines.append(f"**Inference Provider:** `{runner_data.get('provider', 'unknown')}`  ")

    if fireworks_data:
        fmeta = fireworks_data.get("meta", {})
        lines.append(f"**Fireworks Timestamp:** `{fmeta.get('timestamp', 'N/A')}`  ")
        lines.append(f"**Fireworks Model:** `{fmeta.get('model', 'N/A')}`  ")

    lines.extend(["", "---", ""])
    return "\n".join(lines)


def build_sla_table(runner_data: dict) -> str:
    """Build the main SLA benchmark table."""
    results: list[dict[str, Any]] = runner_data.get("benchmark_results", [])
    if not results:
        return "> ⚠️ No benchmark results found in runner data.\n"

    lines = [
        "## Benchmark Results — SLA Assessment",
        "",
        "| Benchmark | Avg | P50 | P95 | Min | Max | Errors | SLA Avg | SLA P95 | Status |",
        "|-----------|-----|-----|-----|-----|-----|--------|---------|---------|--------|",
    ]

    pass_count = 0
    fail_count = 0

    for r in results:
        label     = r.get("label", "Unknown")
        label_key = label.lower().replace(" ", "_")
        avg_ms    = r.get("avg_ms", 0.0)
        p50_ms    = r.get("p50_ms", 0.0)
        p95_ms    = r.get("p95_ms", 0.0)
        min_ms    = r.get("min_ms", 0.0)
        max_ms    = r.get("max_ms", 0.0)
        errors    = r.get("errors", 0)

        avg_key = f"{label_key}_avg_ms"
        p95_key = f"{label_key}_p95_ms"
        sla_avg = SLA_TARGETS.get(avg_key, SLA_TARGETS.get("hypothesis_generation_avg_ms", None))
        sla_p95 = SLA_TARGETS.get(p95_key, SLA_TARGETS.get("hypothesis_generation_p95_ms", None))

        avg_ok = avg_ms <= sla_avg if sla_avg else True
        p95_ok = p95_ms <= sla_p95 if sla_p95 else True
        err_ok = errors == 0

        if avg_ok and p95_ok and err_ok:
            status = "✅ PASS"
            pass_count += 1
        else:
            status = "❌ FAIL"
            fail_count += 1

        sla_avg_str = fmt_ms(sla_avg) if sla_avg else "—"
        sla_p95_str = fmt_ms(sla_p95) if sla_p95 else "—"

        lines.append(
            f"| **{label}** | {fmt_ms(avg_ms)} | {fmt_ms(p50_ms)} | {fmt_ms(p95_ms)} | "
            f"{fmt_ms(min_ms)} | {fmt_ms(max_ms)} | {errors} | "
            f"{sla_avg_str} | {sla_p95_str} | {status} |"
        )

    total = pass_count + fail_count
    lines.extend([
        "",
        f"**SLA Summary:** {pass_count}/{total} benchmarks passing  ",
        f"**Pass Rate:** {(pass_count/total*100) if total else 0:.0f}%",
        "",
    ])
    return "\n".join(lines)


def build_fireworks_section(fireworks_data: dict) -> str:
    """Build the Fireworks AI / AMD-specific performance section."""
    summary   = fireworks_data.get("summary", {})
    calls     = fireworks_data.get("hypothesis_calls", [])
    meta      = fireworks_data.get("meta", {})
    pricing   = summary.get("pricing_model", {})

    if not summary:
        return "> ⚠️ No Fireworks summary data found.\n"

    ttft_avg     = summary.get("ttft_avg_ms", 0)
    ttft_p95     = summary.get("ttft_p95_ms", 0)
    lat_avg      = summary.get("latency_avg_ms", 0)
    lat_p95      = summary.get("latency_p95_ms", 0)
    tok_sec      = summary.get("tokens_per_sec_avg", 0)
    success_rate = summary.get("success_rate_pct", 0)
    avg_cost     = summary.get("avg_cost_per_call_usd", 0)
    inv_cost     = summary.get("estimated_cost_per_investigation_usd", 0)
    in_tok       = summary.get("total_input_tokens", 0)
    out_tok      = summary.get("total_output_tokens", 0)

    ttft_avg_sla = SLA_TARGETS.get("ttft_avg_ms", 3000)
    lat_p95_sla  = SLA_TARGETS.get("hypothesis_generation_p95_ms", 10000)
    tok_sec_sla  = SLA_TARGETS.get("tokens_per_sec_min", 10)

    lines = [
        "## Fireworks AI — AMD Instinct MI300X Performance",
        "",
        f"> **Model:** `{meta.get('model', 'accounts/fireworks/models/gemma-4-31b-it')}`  ",
        f"> **Hardware:** {meta.get('hardware', 'AMD Instinct MI300X')}  ",
        f"> **Calls Tested:** {summary.get('total_calls', 0)}  ",
        f"> **Success Rate:** {success_rate:.0f}%",
        "",
        "### Latency Metrics",
        "",
        "| Metric | Value | SLA Target | Status |",
        "|--------|-------|------------|--------|",
        f"| TTFT Average | {fmt_ms(ttft_avg)} | {fmt_ms(ttft_avg_sla)} | {sla_icon(ttft_avg, ttft_avg_sla)} |",
        f"| TTFT P95 | {fmt_ms(ttft_p95)} | {fmt_ms(ttft_avg_sla * 1.5)} | {sla_icon(ttft_p95, ttft_avg_sla * 1.5)} |",
        f"| Total Latency Average | {fmt_ms(lat_avg)} | — | — |",
        f"| Total Latency P95 | {fmt_ms(lat_p95)} | {fmt_ms(lat_p95_sla)} | {sla_icon(lat_p95, lat_p95_sla)} |",
        f"| Throughput (tok/s) | {tok_sec:.1f} tok/s | ≥{tok_sec_sla:.0f} tok/s | {sla_icon(tok_sec, tok_sec_sla, lower_is_better=False)} |",
        "",
    ]

    if calls:
        lines.extend([
            "### Per-Call Breakdown",
            "",
            "| Prompt | Total | TTFT | Tok/s | In Tok | Out Tok | Cost |",
            "|--------|-------|------|-------|--------|---------|------|",
        ])
        for c in calls:
            ok = "✅" if c.get("success") else "❌"
            lines.append(
                f"| {ok} {c.get('name','?')} | {fmt_ms(c.get('total_latency_ms',0))} | "
                f"{fmt_ms(c.get('ttft_ms',0))} | {c.get('tokens_per_sec',0):.1f} | "
                f"{c.get('input_tokens',0)} | {c.get('output_tokens',0)} | "
                f"{fmt_cost(c.get('cost_usd',0))} |"
            )
        lines.append("")

    return "\n".join(lines)


def build_cost_section(fireworks_data: dict) -> str:
    """Build the cost analysis section."""
    summary = fireworks_data.get("summary", {})
    pricing = summary.get("pricing_model", {})

    avg_cost = summary.get("avg_cost_per_call_usd", 0)
    inv_cost = summary.get("estimated_cost_per_investigation_usd", 0)
    n_calls  = summary.get("calls_per_investigation_estimate", 7)
    in_price = pricing.get("input_per_million_usd", COST_PER_M_INPUT)
    out_price= pricing.get("output_per_million_usd", COST_PER_M_OUTPUT)
    in_tok   = summary.get("total_input_tokens", 0)
    out_tok  = summary.get("total_output_tokens", 0)

    # Scale-up estimates
    investigations_per_day  = 100
    investigations_per_month = investigations_per_day * 30
    cost_per_day   = inv_cost * investigations_per_day
    cost_per_month = inv_cost * investigations_per_month

    lines = [
        "## Cost Analysis — Fireworks AI (Gemma 4 31B IT)",
        "",
        "### Pricing Model",
        "",
        f"| Parameter | Value |",
        f"|-----------|-------|",
        f"| Input token price | ${in_price:.2f} / 1M tokens |",
        f"| Output token price | ${out_price:.2f} / 1M tokens |",
        f"| Model | `accounts/fireworks/models/gemma-4-31b-it` |",
        "",
        "### Per-Call Economics",
        "",
        f"| Scope | Cost |",
        f"|-------|------|",
        f"| Per AI call (avg) | {fmt_cost(avg_cost)} |",
        f"| Per investigation ({n_calls} AI calls) | {fmt_cost(inv_cost)} |",
        f"| 100 investigations/day | {fmt_cost(cost_per_day)} |",
        f"| 3,000 investigations/month | {fmt_cost(cost_per_month)} |",
        "",
        f"*Token usage across {summary.get('total_calls',0)} benchmark calls: "
        f"{in_tok:,} input, {out_tok:,} output tokens*",
        "",
        "> [!TIP]",
        f"> At {fmt_cost(inv_cost)} per investigation, Project Helix delivers enterprise-grade",
        "> AI-assisted evidence analysis at a fraction of traditional consulting costs.",
        "",
    ]
    return "\n".join(lines)


def build_comparison_section(runner_data: dict, fireworks_data: dict) -> str:
    """Build a side-by-side mock vs fireworks comparison."""
    runner_benchmarks = {
        r["label"]: r for r in runner_data.get("benchmark_results", [])
    }

    fw_summary = fireworks_data.get("summary", {})
    mock_hyp   = runner_benchmarks.get("Hypothesis Generation", {})
    fw_hyp_avg = fw_summary.get("latency_avg_ms", 0)
    fw_hyp_p95 = fw_summary.get("latency_p95_ms", 0)

    if not mock_hyp and not fw_hyp_avg:
        return ""

    lines = [
        "## Provider Comparison: Mock vs Fireworks AI",
        "",
        "| Metric | Mock Adapter | Fireworks (Gemma 4 31B IT) | Δ (Overhead) |",
        "|--------|-------------|---------------------------|--------------|",
    ]

    mock_avg = mock_hyp.get("avg_ms", 0) if mock_hyp else 0
    mock_p95 = mock_hyp.get("p95_ms", 0) if mock_hyp else 0
    delta_avg = fw_hyp_avg - mock_avg if fw_hyp_avg and mock_avg else 0
    delta_p95 = fw_hyp_p95 - mock_p95 if fw_hyp_p95 and mock_p95 else 0

    lines.extend([
        f"| Hypothesis Avg | {fmt_ms(mock_avg)} | {fmt_ms(fw_hyp_avg)} | +{fmt_ms(delta_avg)} (network + AI) |",
        f"| Hypothesis P95 | {fmt_ms(mock_p95)} | {fmt_ms(fw_hyp_p95)} | +{fmt_ms(delta_p95)} |",
        f"| Response Quality | Deterministic fixture | Real LLM output | ∞ improvement |",
        f"| Cost | $0 (dev only) | {fmt_cost(fw_summary.get('avg_cost_per_call_usd', 0))}/call | — |",
        "",
        "> [!NOTE]",
        "> Mock adapter uses deterministic fixtures for CI/dev. Fireworks (Gemma 4 31B IT)",
        "> provides production-quality reasoning. The latency delta reflects actual AMD MI300X",
        "> inference time — which includes tokenisation, KV-cache management, and streaming overhead.",
        "",
    ])
    return "\n".join(lines)


def build_recommendations(runner_data: dict, fireworks_data: dict | None) -> str:
    """Build actionable recommendations section."""
    lines = [
        "## Recommendations",
        "",
    ]

    results = runner_data.get("benchmark_results", [])
    failed  = [r for r in results if r.get("errors", 0) > 0]
    slow    = [
        r for r in results
        if r.get("p95_ms", 0) > SLA_TARGETS.get(
            f"{r.get('label','').lower().replace(' ','_')}_p95_ms", float("inf")
        )
    ]

    if not failed and not slow:
        lines.extend([
            "### ✅ All SLA targets met",
            "",
            "- System is performing within specification.",
            "- Consider increasing load test concurrency to stress-test under real traffic.",
            "",
        ])
    else:
        if failed:
            lines.append("### ❌ Error Remediation")
            lines.append("")
            for r in failed:
                lines.append(f"- **{r['label']}**: {r['errors']} errors — check API connectivity and auth token validity")
            lines.append("")

        if slow:
            lines.append("### ⚠️ Performance Tuning")
            lines.append("")
            for r in slow:
                label_key = r.get("label", "").lower().replace(" ", "_")
                sla_p95 = SLA_TARGETS.get(f"{label_key}_p95_ms", float("inf"))
                lines.append(
                    f"- **{r['label']}**: P95={fmt_ms(r['p95_ms'])} exceeds SLA target {fmt_ms(sla_p95)}"
                )
            lines.append("")

    lines.extend([
        "### General",
        "",
        "1. **Production Deployment**: Ensure `--workers 1` for sentence-transformers embedding model.",
        "2. **Fireworks API Key**: Set `FIREWORKS_API_KEY` in `.env` to enable real AI inference.",
        "3. **Model**: Verify `FIREWORKS_MODEL=accounts/fireworks/models/gemma-4-31b-it` in `.env`.",
        "4. **Nginx**: `/api/` route forwards to backend WITHOUT stripping prefix (fixed in RC2).",
        "5. **Health Checks**: `docker compose ps` should show all services as `healthy` before demo.",
        "",
    ])
    return "\n".join(lines)


def build_footer() -> str:
    return (
        "---\n\n"
        "*Report generated by `evaluation/benchmarks/performance_report.py` — "
        "Project Helix RC2 Stabilisation*\n"
    )


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate Project Helix performance report from benchmark results",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--runner-results",
        default="evaluation/benchmarks/results_latest.json",
        help="Path to benchmark_runner.py JSON output",
    )
    parser.add_argument(
        "--fireworks-results",
        default="",
        help="Path to benchmark_fireworks.py JSON output (optional)",
    )
    parser.add_argument(
        "--output",
        default="evaluation/benchmarks/performance_report.md",
        help="Output markdown file path",
    )
    parser.add_argument(
        "--stdout-only", action="store_true",
        help="Print to stdout only, do not write file",
    )
    args = parser.parse_args()

    runner_data    = load_json(args.runner_results)
    fireworks_data = load_json(args.fireworks_results) if args.fireworks_results else None

    # Try to auto-detect fireworks results if not specified
    if not fireworks_data:
        default_fw = Path("evaluation/benchmarks/results_latest.json")
        if default_fw.exists():
            candidate = load_json(default_fw)
            # Check if it has fireworks-specific fields
            if candidate and "hypothesis_calls" in candidate and candidate.get("meta", {}).get("model"):
                fireworks_data = candidate
                if not runner_data:
                    runner_data = candidate  # Same file has both

    if not runner_data and not fireworks_data:
        print("ERROR: No benchmark results found. Run benchmark_runner.py or benchmark_fireworks.py first.")
        sys.exit(1)

    # Build report sections
    sections: list[str] = []
    sections.append(build_header(runner_data, fireworks_data))

    if runner_data and runner_data.get("benchmark_results"):
        sections.append(build_sla_table(runner_data))

    if fireworks_data and fireworks_data.get("summary"):
        sections.append(build_fireworks_section(fireworks_data))
        sections.append(build_cost_section(fireworks_data))

    if runner_data and fireworks_data:
        comp = build_comparison_section(runner_data, fireworks_data)
        if comp:
            sections.append(comp)

    if runner_data:
        sections.append(build_recommendations(runner_data, fireworks_data))

    sections.append(build_footer())

    report = "\n".join(sections)

    # Output
    print(report)

    if not args.stdout_only:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as fh:
            fh.write(report)
        print(f"\n💾 Report saved to: {out_path.resolve()}", file=sys.stderr)

        # Timestamped copy
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        ts_path = out_path.parent / f"performance_report_{ts}.md"
        with ts_path.open("w", encoding="utf-8") as fh:
            fh.write(report)
        print(f"📁 Timestamped: {ts_path.name}", file=sys.stderr)


if __name__ == "__main__":
    main()
