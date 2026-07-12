import { useEffect, useState } from "react";

const STAGES = [
  { label: "Incoming Event", detail: "Deviation #DV-2847", kind: "input" },
  { label: "Knowledge Retrieved", detail: "12 sources · 4 SOPs · 2 batches", kind: "process" },
  { label: "Evidence Ranked", detail: "Top-k = 8 · semantic + temporal", kind: "process" },
  { label: "Reasoning", detail: "Multi-step, evidence-bound", kind: "process" },
  { label: "Confidence", detail: "82%", kind: "signal" },
  { label: "Assessment Generated", detail: "Root cause hypothesis · 3 factors", kind: "output" },
  { label: "CAPA Recommended", detail: "2 preventive · 1 corrective", kind: "output" },
] as const;

export function RuntimePipeline() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative hairline rounded-xl bg-surface/60 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="signal-dot absolute inset-0" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          <span className="text-eyebrow">Runtime · Live</span>
        </div>
        <span className="text-eyebrow">helix.runtime.v2</span>
      </div>

      <ol className="space-y-1.5">
        {STAGES.map((s, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <li key={s.label} className="relative">
              <div
                className={`flex items-center justify-between rounded-md px-3 py-2.5 border transition-all duration-500 ${
                  isActive
                    ? "border-signal/50 bg-signal/[0.06]"
                    : isPast
                    ? "border-border/70 bg-surface-elevated/40"
                    : "border-border/40 bg-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-[10px] w-6 text-center ${
                      isActive ? "text-signal" : "text-muted-foreground"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-[13px] truncate ${
                      isActive ? "text-foreground" : isPast ? "text-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {s.kind === "signal" && isActive ? (
                    <ConfidenceBar />
                  ) : (
                    <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[220px]">
                      {s.detail}
                    </span>
                  )}
                  <StatusDot state={isActive ? "active" : isPast ? "done" : "idle"} />
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div className="h-2 w-px bg-border/60 ml-[26px]" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-eyebrow">Traceable · Evidence-bound · Auditable</span>
        <span className="text-[11px] font-mono text-muted-foreground">latency 1.4s</span>
      </div>
    </div>
  );
}

function StatusDot({ state }: { state: "idle" | "active" | "done" }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        state === "active"
          ? "bg-signal shadow-[0_0_10px_2px_color-mix(in_oklch,var(--signal)_60%,transparent)]"
          : state === "done"
          ? "bg-signal/50"
          : "bg-border-strong"
      }`}
    />
  );
}

function ConfidenceBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-24 rounded-full bg-border/70 overflow-hidden">
        <div
          className="h-full bg-signal"
          style={{ animation: "bar-fill 900ms ease-out forwards", ["--to" as string]: "82%" }}
        />
      </div>
      <span className="text-[11px] font-mono text-signal">82%</span>
    </div>
  );
}
