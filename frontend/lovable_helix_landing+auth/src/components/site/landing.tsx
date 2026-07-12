import { Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { RuntimePipeline } from "@/components/site/runtime-pipeline";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Problem />
      <EvidenceOps />
      <Pillars />
      <Runtime />
      <Enterprise />
      <Architecture />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" aria-hidden />

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center relative">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 hairline rounded-full px-3 py-1 bg-surface/60">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            <span className="text-eyebrow !text-foreground/80">Enterprise EvidenceOps Platform</span>
          </div>
          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.03em] leading-[1.02]">
            Evidence before AI.
            <br />
            <span className="text-muted-foreground">Always.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Helix transforms organizational knowledge into evidence-backed investigation
            intelligence — an operating system for regulated industries where every conclusion
            is traceable to its source.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 bg-signal text-signal-foreground hover:bg-signal/90 transition-colors px-5 py-2.5 rounded-md text-[13.5px] font-medium"
            >
              Launch Helix
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 hairline rounded-md px-5 py-2.5 text-[13.5px] text-foreground/90 hover:bg-surface transition-colors"
            >
              View Architecture
            </a>
          </div>

          <div className="mt-14 grid grid-cols-3 max-w-md gap-8">
            <Metric label="Traceability" value="100%" />
            <Metric label="Avg. confidence" value="0.82" />
            <Metric label="Hallucination" value="0%" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 bg-signal/[0.04] blur-3xl rounded-full pointer-events-none" aria-hidden />
          <RuntimePipeline />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
      <div className="text-eyebrow mt-1">{label}</div>
    </div>
  );
}

/* ---------------- PROBLEM ---------------- */
function Problem() {
  const items = [
    { k: "Scattered PDFs", d: "Documents sit in silos, disconnected from context." },
    { k: "Disconnected Knowledge", d: "SOPs, batches, and incidents live in separate systems." },
    { k: "Slow Investigations", d: "Weeks of manual retrieval and cross-referencing." },
    { k: "No Traceability", d: "Conclusions without evidence chains cannot be audited." },
    { k: "AI Hallucinations", d: "Ungrounded models fabricate root causes and CAPAs." },
  ];
  return (
    <Section eyebrow="The Problem" title="Traditional investigation systems fail regulated industries.">
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-5 gap-px bg-border/70 hairline rounded-lg overflow-hidden">
        {items.map((i, idx) => (
          <div key={i.k} className="bg-background p-6">
            <span className="text-eyebrow">0{idx + 1}</span>
            <h3 className="mt-3 text-[15px] font-medium">{i.k}</h3>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{i.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- EVIDENCE OPS PIPELINE ---------------- */
function EvidenceOps() {
  const stages = [
    "Organization Knowledge",
    "Organization Memory",
    "Evidence",
    "Intelligence",
    "Assessment",
    "CAPA",
    "Organizational Learning",
  ];
  return (
    <Section id="evidenceops" eyebrow="EvidenceOps" title="From organizational knowledge to organizational learning.">
      <p className="mt-4 max-w-2xl text-[14px] text-muted-foreground">
        A closed-loop pipeline where evidence — not inference — drives every decision.
      </p>
      <div className="mt-14 hairline rounded-xl bg-surface/40 p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {stages.map((s, i) => (
            <div key={s} className="relative">
              <div className="hairline rounded-md bg-background p-4 h-full flex flex-col justify-between min-h-[110px]">
                <span className="text-eyebrow">Stage {i + 1}</span>
                <span className="text-[13px] font-medium leading-snug mt-3">{s}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 text-signal/60 z-10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between">
          <span className="text-eyebrow">Closed-loop learning · every investigation strengthens the next</span>
          <span className="text-eyebrow">↻</span>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- FIVE PILLARS ---------------- */
function Pillars() {
  const pillars = [
    {
      k: "Knowledge",
      d: "Structured ingestion of SOPs, batch records, deviations, complaints, and validated protocols into a single semantic layer.",
      m: "SOP · Batch · Protocol",
    },
    {
      k: "Memory",
      d: "Organizational memory that preserves context, decisions, and lineage across investigations and personnel changes.",
      m: "Immutable · Versioned",
    },
    {
      k: "Evidence",
      d: "Every assertion is bound to retrievable, ranked sources with temporal and semantic scoring.",
      m: "Ranked · Traceable",
    },
    {
      k: "Intelligence",
      d: "Reasoning that operates only on retrieved evidence — never fabricated, always inspectable.",
      m: "Evidence-bound",
    },
    {
      k: "CAPA",
      d: "Corrective and preventive actions generated with rationale, dependencies, and downstream effect tracking.",
      m: "Corrective · Preventive",
    },
  ];
  return (
    <Section id="pillars" eyebrow="The Five Pillars" title="Every capability built on evidence.">
      <div className="mt-14 hairline rounded-xl overflow-hidden divide-y divide-border/70">
        {pillars.map((p, i) => (
          <div key={p.k} className="grid grid-cols-12 gap-6 p-6 sm:p-8 group hover:bg-surface/40 transition-colors">
            <div className="col-span-12 sm:col-span-2 flex sm:flex-col items-baseline sm:items-start gap-3">
              <span className="text-eyebrow">Pillar 0{i + 1}</span>
              <span className="text-xl font-medium tracking-tight">{p.k}</span>
            </div>
            <p className="col-span-12 sm:col-span-7 text-[14px] leading-relaxed text-muted-foreground">
              {p.d}
            </p>
            <div className="col-span-12 sm:col-span-3 flex sm:justify-end items-center">
              <span className="font-mono text-[11px] text-signal/90 hairline rounded-full px-3 py-1 bg-signal/[0.05]">
                {p.m}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- RUNTIME ---------------- */
function Runtime() {
  const stages = [
    { k: "Evidence Retrieval", d: "Contextual gather across memory layers.", tag: "retrieve" },
    { k: "Semantic Search", d: "Vector + lexical fusion, temporal decay.", tag: "search" },
    { k: "Reasoning", d: "Multi-step chains grounded in retrieved sources.", tag: "reason" },
    { k: "Confidence", d: "Calibrated scoring per assertion.", tag: "score" },
    { k: "Missing Evidence", d: "Explicit gaps surfaced, never silently filled.", tag: "gaps" },
    { k: "Recommendations", d: "CAPA proposals with dependency traces.", tag: "propose" },
  ];
  return (
    <Section id="runtime" eyebrow="Runtime" title="A living investigation engine.">
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stages.map((s, i) => (
          <div key={s.k} className="hairline rounded-lg bg-surface/40 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-eyebrow">Stage {String(i + 1).padStart(2, "0")}</span>
              <span className="font-mono text-[10px] text-signal">{s.tag}</span>
            </div>
            <h3 className="mt-4 text-[15px] font-medium">{s.k}</h3>
            <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{s.d}</p>
            <div className="mt-5 h-1 rounded-full bg-border/70 overflow-hidden">
              <div
                className="h-full bg-signal/70"
                style={{
                  animation: `bar-fill ${1200 + i * 200}ms ease-out forwards`,
                  ["--to" as string]: `${55 + i * 6}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- ENTERPRISE ---------------- */
function Enterprise() {
  const caps = [
    { k: "Multi-Tenant", d: "Cryptographic isolation per organization with per-tenant memory boundaries." },
    { k: "Private Deployment", d: "VPC, on-prem, or sovereign-cloud with air-gapped inference options." },
    { k: "Audit Trails", d: "Immutable, timestamped logs for every retrieval, inference, and recommendation." },
    { k: "Organization Memory", d: "Longitudinal context preserved across teams, sites, and years." },
    { k: "Knowledge Versioning", d: "Point-in-time reconstruction of what the system knew, when it knew it." },
    { k: "Traceability", d: "Every conclusion resolves to a source document, span, and timestamp." },
  ];
  return (
    <Section eyebrow="Enterprise" title="Built for regulated industries.">
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/70 hairline rounded-lg overflow-hidden">
        {caps.map((c) => (
          <div key={c.k} className="bg-background p-6 min-h-[160px] flex flex-col">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="text-[13.5px] font-medium">{c.k}</span>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- ARCHITECTURE ---------------- */
function Architecture() {
  const layers = [
    { k: "Organization", d: "Users, roles, sites, regulatory context" },
    { k: "Source Data", d: "SOPs · Batches · Deviations · Complaints" },
    { k: "Organization Memory", d: "Immutable, versioned semantic memory" },
    { k: "Knowledge Layer", d: "Indexed evidence graph with lineage" },
    { k: "Runtime", d: "Retrieval · Reasoning · Confidence · Gaps" },
    { k: "Assessment", d: "Grounded conclusions with rationale" },
    { k: "CAPA", d: "Actions with dependencies and effect tracking" },
  ];
  return (
    <Section id="architecture" eyebrow="Architecture" title="One system. Seven layers. Zero ungrounded output.">
      <div className="mt-14 hairline rounded-xl bg-surface/40 p-6 sm:p-8">
        <div className="space-y-2">
          {layers.map((l, i) => (
            <div
              key={l.k}
              className="grid grid-cols-12 items-center gap-4 hairline rounded-md bg-background px-5 py-4"
            >
              <span className="col-span-2 sm:col-span-1 font-mono text-[11px] text-muted-foreground">
                L{i}
              </span>
              <span className="col-span-10 sm:col-span-4 text-[13.5px] font-medium">{l.k}</span>
              <span className="hidden sm:block col-span-6 text-[12.5px] text-muted-foreground">
                {l.d}
              </span>
              <div className="hidden sm:flex col-span-1 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-signal/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 mt-32">
      <div className="relative hairline-strong rounded-2xl overflow-hidden bg-surface/50 px-8 py-16 sm:px-16 sm:py-24 text-center">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />
        <div className="relative">
          <span className="text-eyebrow">The next investigation</span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-medium tracking-[-0.02em]">
            Ready to transform investigations?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[14px] text-muted-foreground">
            Move from scattered evidence to grounded intelligence — with every conclusion
            traceable to its source.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-signal text-signal-foreground hover:bg-signal/90 transition-colors px-5 py-2.5 rounded-md text-[13.5px] font-medium"
            >
              Launch Helix
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 hairline rounded-md px-5 py-2.5 text-[13.5px] hover:bg-surface transition-colors"
            >
              Request Access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Layout primitives ---------------- */
function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-6 mt-32 scroll-mt-24">
      <div className="max-w-3xl">
        <span className="text-eyebrow">{eyebrow}</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
