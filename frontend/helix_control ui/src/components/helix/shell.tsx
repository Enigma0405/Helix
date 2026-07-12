import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function HelixMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 4C10 8 14 12 20 20" stroke="url(#hg)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 4C14 8 10 12 4 20" stroke="url(#hg)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.6" fill="oklch(0.72 0.13 210)"/>
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="oklch(0.82 0.14 210)"/>
          <stop offset="1" stopColor="oklch(0.55 0.16 260)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TopBar({ crumbs }: { crumbs?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/70 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-4 px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <HelixMark className="h-5 w-5" />
          <span className="text-[15px] font-semibold tracking-tight">Helix</span>
          <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">EvidenceOps</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/50 transition">
          <span className="h-5 w-5 rounded-sm bg-gradient-to-br from-[oklch(0.65_0.15_170)] to-[oklch(0.55_0.15_220)] grid place-items-center text-[10px] font-bold text-background">A</span>
          <span className="font-medium">Aetheris BioPharma</span>
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted-foreground"><path d="M3 5l3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>

        {crumbs && <><div className="h-4 w-px bg-border" />{crumbs}</>}

        <div className="flex-1" />

        <div className="relative w-[380px] max-w-[40vw]">
          <svg viewBox="0 0 16 16" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"><circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" strokeWidth="1.4"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input
            placeholder="Search evidence, batches, SOPs, investigations…"
            className="w-full h-8 rounded-md bg-surface-sunken border border-border pl-8 pr-14 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-mono text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">⌘K</kbd>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal-ok)] shadow-[0_0_8px_var(--signal-ok)]" />
            Systems nominal
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <button className="flex items-center gap-2 text-sm">
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[oklch(0.45_0.10_220)] to-[oklch(0.35_0.10_260)] grid place-items-center text-[11px] font-semibold">RS</span>
        </button>
      </div>
    </header>
  );
}

export function SignalBadge({ level, children }: { level: "critical" | "major" | "minor" | "ok" | "info"; children: ReactNode }) {
  const map = {
    critical: "text-[var(--signal-critical)] border-[var(--signal-critical)]/30 bg-[var(--signal-critical)]/10",
    major: "text-[var(--signal-major)] border-[var(--signal-major)]/30 bg-[var(--signal-major)]/10",
    minor: "text-[var(--signal-minor)] border-[var(--signal-minor)]/30 bg-[var(--signal-minor)]/10",
    ok: "text-[var(--signal-ok)] border-[var(--signal-ok)]/30 bg-[var(--signal-ok)]/10",
    info: "text-[var(--signal-info)] border-[var(--signal-info)]/30 bg-[var(--signal-info)]/10",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-[0.14em] border rounded px-1.5 py-0.5 ${map[level]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Metric({ label, value, delta, tone = "muted" }: { label: string; value: string; delta?: string; tone?: "ok" | "warn" | "crit" | "muted" }) {
  const toneMap = {
    ok: "text-[var(--signal-ok)]",
    warn: "text-[var(--signal-major)]",
    crit: "text-[var(--signal-critical)]",
    muted: "text-muted-foreground",
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-medium tracking-tight tabular-nums">{value}</div>
        {delta && <div className={`text-mono text-[11px] ${toneMap[tone]}`}>{delta}</div>}
      </div>
    </div>
  );
}
