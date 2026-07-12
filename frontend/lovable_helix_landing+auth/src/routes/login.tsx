import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HelixMark } from "@/components/site/chrome";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Helix" },
      { name: "description", content: "Sign in to Helix Enterprise EvidenceOps Platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Frontend-only transition to preparing state
    setTimeout(() => navigate({ to: "/preparing" }), 350);
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT — Philosophy */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 border-r border-border/60 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />
        <Link to="/" className="relative flex items-center gap-2.5">
          <HelixMark />
          <span className="text-[13px] font-medium">Helix</span>
          <span className="text-eyebrow ml-2">Enterprise EvidenceOps</span>
        </Link>

        <div className="relative max-w-md">
          <span className="text-eyebrow">Philosophy</span>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.02em] leading-[1.1]">
            Evidence before AI.
            <br />
            <span className="text-muted-foreground">Always.</span>
          </h1>

          <div className="mt-10 space-y-6">
            <Pillar
              k="Organization Memory"
              d="Longitudinal, versioned knowledge preserved across teams and time."
            />
            <Pillar
              k="Runtime"
              d="Retrieval, reasoning, and confidence — grounded in retrieved evidence."
            />
            <Pillar
              k="Traceable Intelligence"
              d="Every conclusion resolves to a source. No hallucinations. No exceptions."
            />
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] font-mono text-muted-foreground">
          <span>SOC 2</span>
          <span>ISO 27001</span>
          <span>HIPAA</span>
          <span>Audit-Ready</span>
          <span>Private Deployment</span>
        </div>
      </aside>

      {/* RIGHT — Login card */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <HelixMark />
            <span className="text-[13px] font-medium">Helix</span>
          </Link>

          <span className="text-eyebrow">Access</span>
          <h2 className="mt-3 text-2xl font-medium tracking-tight">Sign in to Helix</h2>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            Continue to your organization's intelligence layer.
          </p>

          <form onSubmit={onSubmit} className="mt-9 space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••••••"
              autoComplete="current-password"
              rightSlot={
                <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password
                </a>
              }
              required
            />

            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground select-none">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded-sm border border-border bg-input accent-signal"
              />
              Remember me on this device
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-70 transition-colors px-4 py-2.5 rounded-md text-[13.5px] font-medium"
            >
              {submitting ? "Authenticating…" : "Sign in"}
              {!submitting && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border/70" />
            <span className="text-eyebrow">or</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <a
            href="#"
            className="w-full inline-flex items-center justify-center gap-2 hairline rounded-md px-4 py-2.5 text-[13px] text-foreground/90 hover:bg-surface transition-colors"
          >
            Request Access
          </a>

          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <span>SOC 2</span>
            <span aria-hidden>·</span>
            <span>Enterprise</span>
            <span aria-hidden>·</span>
            <span>Privacy</span>
            <span aria-hidden>·</span>
            <span>Audit Ready</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  rightSlot,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
          {label}
        </label>
        {rightSlot}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full bg-input/60 hairline rounded-md px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-signal/60 focus:ring-2 focus:ring-signal/20 transition"
      />
    </div>
  );
}

function Pillar({ k, d }: { k: string; d: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
      <div>
        <div className="text-[13.5px] font-medium">{k}</div>
        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{d}</p>
      </div>
    </div>
  );
}
