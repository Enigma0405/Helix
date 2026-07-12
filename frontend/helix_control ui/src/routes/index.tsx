import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar, SignalBadge, Metric } from "@/components/helix/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — Helix EvidenceOps" },
      { name: "description", content: "Operational command center for pharmaceutical quality operations." },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  return (
    <div className="min-h-screen">
      <TopBar
        crumbs={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hyderabad · VISK Site</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">Mission Control</span>
          </div>
        }
      />

      {/* Page header */}
      <div className="border-b border-border/60 px-6 py-6">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <div className="text-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Operational command · Shift B · 14:22 IST</div>
            <h1 className="mt-2 text-[28px] font-medium tracking-tight">Good afternoon, Rohan.</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Everything you're responsible for, correlated in one place. 1 major signal requires your attention. 3 investigations are progressing.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <SelectorPill label="Organization" value="Aetheris BioPharma" />
            <SelectorPill label="Site" value="VISK · Hyderabad" />
            <SelectorPill label="Products" value="12 active" />
            <SelectorPill label="Shift" value="B · 14:00–22:00" />
          </div>
        </div>
      </div>

      {/* Featured signal */}
      <div className="px-6 pt-6">
        <FeaturedSignal />
      </div>

      {/* Metrics strip */}
      <div className="px-6 mt-6 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard label="Open Investigations" value="7" delta="+2 vs yesterday" tone="warn" />
        <MetricCard label="Quality Events (24h)" value="14" delta="-3" tone="ok" />
        <MetricCard label="Open CAPAs" value="23" delta="4 overdue" tone="warn" />
        <MetricCard label="Equipment Health" value="97.4%" delta="1 alert" tone="ok" />
        <MetricCard label="Batches Released (7d)" value="42" delta="on target" tone="ok" />
        <MetricCard label="Open Deviations" value="9" delta="+1" tone="warn" />
        <MetricCard label="Regulatory Readiness" value="A−" delta="MHRA scheduled Q3" tone="ok" />
      </div>

      {/* Main grid */}
      <div className="px-6 mt-6 grid grid-cols-12 gap-4 pb-16">
        {/* Left column — signals + queue */}
        <div className="col-span-12 xl:col-span-8 space-y-4">
          <Panel title="Recent Operational Signals" subtitle="Correlated from 14 source systems · last 24h" action="View all">
            <div className="divide-y divide-border/60">
              {signals.map((s) => (
                <SignalRow key={s.id} {...s} />
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Investigation Queue" subtitle="Assigned to you & your teams">
              <ul className="divide-y divide-border/60">
                {queue.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 py-2.5">
                    <div className="text-mono text-[11px] text-muted-foreground w-14">{q.id}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{q.title}</div>
                      <div className="text-[11px] text-muted-foreground">{q.stage} · {q.owner}</div>
                    </div>
                    <SignalBadge level={q.level}>{q.status}</SignalBadge>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Recent AI Insights" subtitle="Helix reasoning · reviewed by you weekly">
              <ul className="space-y-3">
                {insights.map((i, idx) => (
                  <li key={idx} className="group">
                    <div className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                      <div className="flex-1">
                        <div className="text-sm leading-snug">{i.text}</div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="text-mono">{i.confidence}</span>
                          <span>·</span>
                          <span>{i.source}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Operational Health" subtitle="Cross-plant · real-time">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Metric label="OEE — Sterile Block" value="86.4%" delta="+1.2 pts" tone="ok" />
              <Metric label="First-Pass Yield" value="98.1%" delta="stable" tone="muted" />
              <Metric label="EM Excursions (30d)" value="3" delta="1 major" tone="warn" />
              <Metric label="Line Clearance TAT" value="42m" delta="-8m" tone="ok" />
            </div>
            <div className="mt-6">
              <MiniSpark />
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <Panel title="Quality Events" action="Drilldown">
            <BarStack items={[
              { label: "Deviations", value: 9, tone: "warn" },
              { label: "Complaints", value: 4, tone: "warn" },
              { label: "OOS", value: 2, tone: "crit" },
              { label: "OOT", value: 6, tone: "warn" },
              { label: "Change Ctrls", value: 11, tone: "info" },
            ]} />
          </Panel>

          <Panel title="Supplier Alerts" subtitle="3 active">
            {suppliers.map((s) => (
              <div key={s.name} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="h-8 w-8 rounded-md bg-surface-sunken border border-border grid place-items-center text-[10px] font-semibold text-mono">{s.tag}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{s.note}</div>
                </div>
                <SignalBadge level={s.level}>{s.status}</SignalBadge>
              </div>
            ))}
          </Panel>

          <Panel title="Knowledge Graph" subtitle="Aetheris organizational memory">
            <KnowledgeGraph />
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              {[
                ["Documents", "48,214"],
                ["SOPs", "1,204"],
                ["Investigations", "3,891"],
                ["Equipment", "612"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-t border-border/50 pt-1.5">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="text-mono tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Batch Releases">
            <ul className="text-sm divide-y divide-border/50">
              {batches.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-mono text-[11px]">{b.id}</div>
                    <div className="text-[12px] text-muted-foreground">{b.product}</div>
                  </div>
                  <SignalBadge level={b.level}>{b.status}</SignalBadge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SelectorPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col text-right">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function FeaturedSignal() {
  return (
    <Link
      to="/investigation/$id"
      params={{ id: "INV-2041" }}
      className="group relative block panel-elevated p-6 overflow-hidden hover:border-[var(--signal-major)]/50 transition"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.62_0.20_50/0.14),transparent_55%)] pointer-events-none" />
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--signal-major)]/60 to-transparent" />

      <div className="relative flex items-start gap-6 flex-wrap">
        <div className="flex-1 min-w-[320px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--signal-major)]/70 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--signal-major)]" />
            </span>
            <span className="text-mono text-[11px] uppercase tracking-[0.2em] text-[var(--signal-major)]">Major quality signal · requires investigation</span>
          </div>

          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <div className="text-mono text-[11px] text-muted-foreground">INV-2041</div>
            <h2 className="text-2xl font-medium tracking-tight">Injectra 1&nbsp;g · Sterile Block · particulate variance in Line&nbsp;4 batches</h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Cluster of 3 in-process observations across batches <span className="text-mono text-foreground">B24-1187</span>, <span className="text-mono text-foreground">B24-1189</span>, <span className="text-mono text-foreground">B24-1194</span> correlates with a supplier lot change and an environmental monitoring excursion on 09 Jul.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
            <TagStat label="Site" value="VISK · Hyderabad" />
            <TagStat label="Area" value="Sterile Block · Line 4" />
            <TagStat label="Product" value="Injectra 1 g" />
            <TagStat label="Confidence" value="Medium · 62%" tone="warn" />
            <TagStat label="Evidence" value="18 items · 4 gaps" />
            <TagStat label="First observed" value="09 Jul 04:12 IST" />
          </div>
        </div>

        <div className="w-[280px] shrink-0 space-y-3">
          <div className="rounded-md border border-border/70 bg-surface-sunken/60 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Correlated evidence sources</div>
            <div className="flex flex-wrap gap-1.5">
              {["Complaint × 1", "Deviations × 3", "EM Excursion", "Batch Records × 3", "Supplier CoA", "Equipment Log", "Line Clearance"].map((t) => (
                <span key={t} className="text-[11px] text-mono border border-border rounded px-1.5 py-0.5 bg-surface">{t}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border/70 bg-surface-sunken/60 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Suggested action</div>
              <div className="text-sm font-medium mt-1">Open Evidence Workspace</div>
            </div>
            <div className="h-8 w-8 rounded-md bg-primary/15 text-primary grid place-items-center group-hover:translate-x-0.5 transition">
              <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M4 8h8m-3-3l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TagStat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/80">{label}</span>
      <span className={tone === "warn" ? "text-[var(--signal-major)] text-mono" : "text-foreground text-mono"}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "ok" | "warn" | "crit" }) {
  const toneMap = { ok: "text-[var(--signal-ok)]", warn: "text-[var(--signal-major)]", crit: "text-[var(--signal-critical)]" };
  return (
    <div className="panel p-3.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <div className="text-xl font-medium tabular-nums tracking-tight">{value}</div>
        <div className={`text-mono text-[11px] ${toneMap[tone]}`}>{delta}</div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div>
          <h3 className="text-[13px] font-medium tracking-tight">{title}</h3>
          {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
        {action && <button className="text-[11px] text-primary hover:underline">{action}</button>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

const signals = [
  { id: "SIG-8821", ts: "14:12", area: "Sterile Block · L4", title: "Particulate variance detected during in-process check", src: "IPC · Vision system", level: "major" as const, tag: "Injectra 1 g" },
  { id: "SIG-8820", ts: "13:41", area: "Warehouse · Cold Store", title: "Temperature excursion 2.1°C above range for 12 min", src: "SCADA · Zone C-4", level: "minor" as const, tag: "Multi-product" },
  { id: "SIG-8819", ts: "12:58", area: "Utilities · WFI Loop", title: "Conductivity trending toward action limit", src: "PLC · WFI-01", level: "minor" as const, tag: "Facility" },
  { id: "SIG-8818", ts: "11:22", area: "QC Micro", title: "EM plate excursion — Grade B corridor 9 Jul retro-flagged", src: "LIMS", level: "major" as const, tag: "Correlates: SIG-8821" },
  { id: "SIG-8817", ts: "09:47", area: "Packaging · L2", title: "Serialization mismatch resolved after operator intervention", src: "Track & Trace", level: "ok" as const, tag: "Closed" },
  { id: "SIG-8816", ts: "08:15", area: "Supplier Intake", title: "New lot of silicone tubing received from Vendor NR-14", src: "SAP MM", level: "info" as const, tag: "Lot NR14-0817" },
];

function SignalRow(s: (typeof signals)[number]) {
  return (
    <div className="grid grid-cols-[54px_1fr_auto] gap-4 py-3 items-center group hover:bg-accent/30 -mx-4 px-4 transition">
      <div className="text-mono text-[11px] text-muted-foreground">{s.ts}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-mono text-[11px] text-muted-foreground">{s.id}</span>
          <span className="text-[11px] text-muted-foreground/80">{s.area}</span>
        </div>
        <div className="text-sm truncate">{s.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{s.src} · {s.tag}</div>
      </div>
      <SignalBadge level={s.level}>{s.level}</SignalBadge>
    </div>
  );
}

const queue = [
  { id: "INV-2041", title: "Injectra 1 g · particulate variance", stage: "Evidence gathering", owner: "R. Shankar", status: "Active", level: "major" as const },
  { id: "INV-2038", title: "Cerivax vial closure integrity drift", stage: "Hypothesis review", owner: "P. Iyer", status: "Review", level: "minor" as const },
  { id: "INV-2035", title: "Warehouse cold-chain excursion cluster", stage: "CAPA drafting", owner: "M. Rao", status: "CAPA", level: "info" as const },
  { id: "INV-2029", title: "WFI conductivity trending — Loop A", stage: "Root cause identified", owner: "S. Nair", status: "Closing", level: "ok" as const },
];

const insights = [
  { text: "3 batches on Line 4 share the same silicone tubing supplier lot NR14-0812 — 78% overlap with current signal.", confidence: "Confidence 0.82", source: "Cross-batch pattern · 09–11 Jul" },
  { text: "Historical investigation INV-1842 (Q3 '23) resolved a similar particulate profile via tubing supplier requalification.", confidence: "Similarity 0.91", source: "Case memory · Aetheris" },
  { text: "EM excursion on 09 Jul in Grade B corridor precedes 4 of 5 particulate signals in the last 90 days.", confidence: "Confidence 0.74", source: "Temporal correlation" },
];

const suppliers = [
  { name: "Nirmalya Rubber Ind. · NR-14", tag: "NR", note: "3 open complaints across 2 sites in trailing 60d", level: "major" as const, status: "Watch" },
  { name: "SilTech Elastomers", tag: "ST", note: "CoA fields incomplete for last 4 shipments", level: "minor" as const, status: "Query" },
  { name: "Aureus Glass Vials", tag: "AG", note: "Requalification audit scheduled 22 Jul", level: "info" as const, status: "Ok" },
];

const batches = [
  { id: "B24-1194", product: "Injectra 1 g · Line 4", level: "major" as const, status: "Hold" },
  { id: "B24-1192", product: "Cerivax 500 mg · Line 2", level: "ok" as const, status: "Released" },
  { id: "B24-1190", product: "Volistan 5% · Line 6", level: "ok" as const, status: "Released" },
  { id: "B24-1189", product: "Injectra 1 g · Line 4", level: "minor" as const, status: "Review" },
];

function BarStack({ items }: { items: { label: string; value: number; tone: "warn" | "crit" | "info" }[] }) {
  const max = Math.max(...items.map((i) => i.value));
  const toneMap = { warn: "bg-[var(--signal-major)]/70", crit: "bg-[var(--signal-critical)]/70", info: "bg-[var(--signal-info)]/70" };
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-[12px]">
          <div className="text-muted-foreground">{i.label}</div>
          <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
            <div className={`h-full ${toneMap[i.tone]}`} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <div className="text-right text-mono tabular-nums">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniSpark() {
  const pts = [12, 14, 13, 16, 15, 17, 14, 18, 20, 18, 21, 19, 22, 20, 23, 21, 24, 22, 25, 23, 26, 28, 25, 29];
  const max = Math.max(...pts), min = Math.min(...pts);
  const w = 100, h = 30;
  const path = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - ((p - min) / (max - min)) * h}`).join(" ");
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span>Signals correlated · trailing 24h</span>
        <span className="text-mono">+18% vs prior day</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.72 0.13 210)" stopOpacity="0.35" />
            <stop offset="1" stopColor="oklch(0.72 0.13 210)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,${h} ${path} ${w},${h}`} fill="url(#sg)" />
        <polyline points={path} fill="none" stroke="oklch(0.78 0.13 210)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function KnowledgeGraph() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-32">
      <defs>
        <radialGradient id="node">
          <stop offset="0" stopColor="oklch(0.85 0.14 210)" />
          <stop offset="1" stopColor="oklch(0.55 0.14 220)" />
        </radialGradient>
      </defs>
      {[
        [30, 40, 90, 30], [30, 40, 60, 90], [90, 30, 150, 25], [90, 30, 130, 75],
        [60, 90, 130, 75], [150, 25, 200, 55], [130, 75, 200, 55], [130, 75, 180, 110],
        [200, 55, 180, 110],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.72 0.13 210 / 0.35)" strokeWidth="0.7" />
      ))}
      {[
        [30, 40, 4], [90, 30, 3], [60, 90, 5], [150, 25, 3.5], [130, 75, 6], [200, 55, 4], [180, 110, 3],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={(r as number) + 3} fill="oklch(0.72 0.13 210 / 0.12)" />
          <circle cx={cx} cy={cy} r={r as number} fill="url(#node)" />
        </g>
      ))}
    </svg>
  );
}
