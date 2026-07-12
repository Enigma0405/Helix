import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HelixMark } from "@/components/helix/shell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Helix EvidenceOps" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("r.shankar@aetheris.bio");
  const [pwd, setPwd] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left — brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-border overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.30_0.08_220/0.5),transparent_60%)]" />

        <div className="relative flex items-center gap-3">
          <HelixMark className="h-7 w-7" />
          <div>
            <div className="text-lg font-semibold tracking-tight">Helix</div>
            <div className="text-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">EvidenceOps Platform</div>
          </div>
        </div>

        <div className="relative max-w-lg space-y-6">
          <div className="text-mono text-[11px] uppercase tracking-[0.24em] text-primary/90">// A new category of enterprise software</div>
          <h1 className="text-4xl font-medium tracking-tight leading-[1.1]">
            Turn scattered operational evidence into explainable investigations.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Helix correlates batch records, deviations, complaints, equipment logs, SOPs, historical CAPAs and organizational knowledge into a single connected intelligence surface — with full traceability from signal to root cause.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
            {[
              ["Signals correlated", "1.4M"],
              ["Median TTI reduction", "-62%"],
              ["Audit-ready trace", "100%"],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-2xl font-medium tracking-tight tabular-nums">{v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-4">
          <span>SOC 2 Type II</span><span>·</span><span>ISO 27001</span><span>·</span><span>21 CFR Part 11</span><span>·</span><span>GxP-Aligned</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <HelixMark className="h-6 w-6" />
            <span className="font-semibold">Helix</span>
          </div>

          <div className="text-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Secure sign-in</div>
          <h2 className="text-2xl font-medium tracking-tight">Continue to Helix</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Signing in to <span className="text-foreground">Aetheris BioPharma</span> · Hyderabad
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => nav({ to: "/" }), 700);
            }}
            className="mt-8 space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-md bg-surface-sunken border border-border px-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Password</label>
                <button type="button" className="text-[11px] text-primary hover:underline">Use SSO instead</button>
              </div>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full h-10 rounded-md bg-surface-sunken border border-border px-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-10 rounded-md bg-gradient-to-b from-[oklch(0.78_0.13_210)] to-[oklch(0.62_0.15_220)] text-[oklch(0.12_0.02_250)] font-medium text-sm shadow-[0_1px_0_0_oklch(1_0_0/0.2)_inset,0_10px_30px_-10px_oklch(0.62_0.15_220/0.6)] hover:brightness-110 transition disabled:opacity-70"
            >
              {loading ? "Authenticating…" : "Sign in with SAML"}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span></div>
            </div>

            <button type="button" className="w-full h-10 rounded-md border border-border bg-surface hover:bg-accent/60 text-sm">
              Continue with Aetheris IdP · Okta
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 text-[11px] text-muted-foreground">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[var(--signal-ok)]"><path d="M8 1l6 3v4c0 4-3 6.5-6 7-3-.5-6-3-6-7V4l6-3z" stroke="currentColor" fill="none" strokeWidth="1.2"/></svg>
            Encrypted session · Audit trail active · Session id will be logged
          </div>
        </div>
      </div>
    </div>
  );
}
