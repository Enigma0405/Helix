import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useLogin } from "@/features/auth/api/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { HelixMark } from "@/components/site/chrome";
import { useAuthStore } from "@/store/auth";

const loginSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = zod.infer<typeof loginSchema>;

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

export const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  
  React.useEffect(() => {
    if (token) {
      navigate("/app");
    }
  }, [token, navigate]);

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFields) => {
    loginMutation.mutate({ email: data.email, password: data.password });
  };

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

          <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                  Email
                </label>
              </div>
              <input
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                {...register("email")}
                className="w-full bg-input/60 hairline rounded-md px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-signal/60 focus:ring-2 focus:ring-signal/20 transition"
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                  Password
                </label>
                <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                {...register("password")}
                className="w-full bg-input/60 hairline rounded-md px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-signal/60 focus:ring-2 focus:ring-signal/20 transition"
              />
              {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground select-none pt-2 pb-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded-sm border border-border bg-input accent-signal"
              />
              Remember me on this device
            </label>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-70 transition-colors px-4 py-2.5 rounded-md text-[13.5px] font-medium"
            >
              {loginMutation.isPending ? "Authenticating…" : "Sign in"}
              {!loginMutation.isPending && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          {loginMutation.isError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center">
              {(loginMutation.error as any)?.message || "Invalid email or password."}
            </div>
          )}

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
};
