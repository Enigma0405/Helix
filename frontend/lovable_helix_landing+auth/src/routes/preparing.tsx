import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelixMark } from "@/components/site/chrome";

export const Route = createFileRoute("/preparing")({
  head: () => ({
    meta: [
      { title: "Preparing Organization Intelligence — Helix" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreparingPage,
});

const STEPS = [
  "Preparing Organization Intelligence",
  "Retrieving Organization Memory",
  "Loading Runtime",
  "Connecting Knowledge Layer",
];

function PreparingPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s < STEPS.length ? s + 1 : s));
    }, 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" aria-hidden />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <HelixMark />
          <span className="text-[13px] font-medium">Helix</span>
          <span className="text-eyebrow ml-2">Runtime · Booting</span>
        </Link>

        <div className="hairline rounded-xl bg-surface/60 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="signal-dot absolute inset-0" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="text-eyebrow">Initializing organization</span>
          </div>

          <ol className="space-y-2.5">
            {STEPS.map((s, i) => {
              const state = i < step ? "done" : i === step ? "active" : "idle";
              return (
                <li
                  key={s}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 border transition-all duration-500 ${
                    state === "active"
                      ? "border-signal/50 bg-signal/[0.06]"
                      : state === "done"
                      ? "border-border/70 bg-surface-elevated/40"
                      : "border-border/40"
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-[13px] flex-1 ${
                      state === "idle" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {s}
                    {state === "active" ? "…" : ""}
                  </span>
                  {state === "done" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-signal">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {state === "active" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_2px_color-mix(in_oklch,var(--signal)_60%,transparent)]" />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-eyebrow">Mission Control · Standby</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {Math.min(step, STEPS.length)}/{STEPS.length}
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Mission Control will be available in the next release.
        </p>
      </div>
    </div>
  );
}
