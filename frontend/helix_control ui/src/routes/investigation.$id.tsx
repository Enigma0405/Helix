import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar, SignalBadge } from "@/components/helix/shell";

export const Route = createFileRoute("/investigation/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Investigation ${params.id} — Helix EvidenceOps` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EvidenceWorkspace,
});

type DetailKind =
  | { type: "equipment"; name: string }
  | { type: "history"; id: string }
  | { type: "batch"; id: string }
  | { type: "gap"; label: string }
  | { type: "sop"; id: string }
  | null;

function EvidenceWorkspace() {
  const { id } = Route.useParams();
  const [detail, setDetail] = useState<DetailKind>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string>("EV-04");

  return (
    <div className="min-h-screen">
      <TopBar
        crumbs={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Mission Control</Link>
            <span className="text-muted-foreground/40">/</span>
            <span>Investigations</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground text-mono text-[13px]">{id}</span>
          </div>
        }
      />

      {/* Investigation banner */}
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SignalBadge level="major">Major quality signal</SignalBadge>
              <span className="text-mono text-[11px] text-muted-foreground">Opened 11 Jul · 04:12 IST · Owner: R. Shankar (QA)</span>
            </div>
            <h1 className="mt-2 text-2xl font-medium tracking-tight">
              Injectra 1 g · Sterile Block · particulate variance across Line 4 batches
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
              Investigating a cluster of in-process particulate observations in three consecutive batches, temporally correlated with a Grade B environmental excursion and a change of supplier lot for silicone tubing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatCell label="Timeline" value="72h open" />
            <StatCell label="Risk" value="Elevated" tone="warn" />
            <StatCell label="Status" value="Evidence gathering" />
            <StatCell label="Confidence" value="0.62" tone="warn" />
            <button className="h-9 rounded-md border border-border bg-surface hover:bg-accent/60 px-3 text-sm">Export dossier</button>
            <button className="h-9 rounded-md bg-primary/90 hover:bg-primary text-primary-foreground px-3 text-sm font-medium">Advance to Hypothesis Review</button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-12 gap-4 p-4 min-h-[calc(100vh-14rem)]">
        {/* LEFT — Incoming Evidence */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <ColumnHeader eyebrow="Incoming" title="Evidence" count={evidence.length} />

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {["All", "Facts", "Gaps", "Conflicts"].map((f, i) => (
              <button key={f} className={`px-2 py-1 rounded border ${i === 0 ? "border-primary/40 text-foreground bg-primary/10" : "border-border hover:bg-accent/40"}`}>{f}</button>
            ))}
          </div>

          <div className="space-y-2">
            {evidence.map((e) => (
              <EvidenceCard key={e.id} e={e} active={selectedEvidence === e.id} onClick={() => setSelectedEvidence(e.id)} />
            ))}
          </div>

          <button className="w-full mt-2 text-[12px] rounded-md border border-dashed border-border py-2 text-muted-foreground hover:bg-accent/30 hover:text-foreground">
            + Attach evidence
          </button>
        </aside>

        {/* CENTER — Investigation Intelligence */}
        <main className="col-span-12 lg:col-span-6 space-y-4">
          <section className="panel-elevated p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <BlockStat label="Problem" value="Particulate variance · Line 4" mono />
              <BlockStat label="First observed" value="09 Jul · 04:12 IST" mono />
              <BlockStat label="Risk to patient" value="Elevated" tone="warn" />
              <BlockStat label="Regulatory relevance" value="21 CFR 211.192" mono />
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-6 text-[12px]">
              <ProgressLegend label="Confidence" pct={62} tone="warn" />
              <div className="text-muted-foreground">Evidence completeness</div>
              <div className="flex-1 h-1.5 rounded-full bg-surface-sunken overflow-hidden max-w-[220px]">
                <div className="h-full bg-[var(--signal-major)]/70" style={{ width: "68%" }} />
              </div>
              <div className="text-mono tabular-nums">14 / 22 items</div>
            </div>
          </section>

          {/* Timeline */}
          <section className="panel p-5">
            <SectionHead title="Investigation Timeline" subtitle="Every evidence item on one chronological axis · contradictions highlighted" />
            <Timeline onSelect={setSelectedEvidence} selected={selectedEvidence} />
          </section>

          {/* Findings */}
          <section className="panel">
            <header className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Helix Findings</div>
                <h3 className="text-[15px] font-medium mt-0.5 tracking-tight">Reasoning · Facts, Hypotheses, Recommendations</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Chip color="fact">Fact</Chip>
                <Chip color="hypothesis">Hypothesis</Chip>
                <Chip color="gap">Gap</Chip>
                <Chip color="conflict">Conflict</Chip>
              </div>
            </header>

            <div className="p-5 space-y-6">
              <Findings>
                <FindingHead>Evidence Summary</FindingHead>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  Between 09–11 Jul, three batches of Injectra 1 g manufactured on Line 4 exhibited in-process particulate readings above trending limits. A Grade B environmental monitoring excursion in the adjacent corridor was recorded on 09 Jul at 03:41 IST — 31 minutes before the first affected batch entered aseptic filling. Silicone tubing on Line 4 was replaced on 08 Jul with lot <span className="text-mono text-foreground">NR14-0812</span> from supplier <span className="text-foreground">Nirmalya Rubber Industries</span>.
                </p>

                <FindingHead>Observed Patterns</FindingHead>
                <ul className="space-y-2 text-[13.5px]">
                  <PatternRow tag="fact" text="Particulate readings on affected batches are 3.4–4.1× the trailing 90-day mean, with a similar size distribution profile." />
                  <PatternRow tag="fact" text="All three affected batches share the same tubing lot NR14-0812 and the same fill start window (04:00–06:30 IST)." />
                  <PatternRow tag="fact" text="Environmental excursion at 09 Jul 03:41 preceded 100% of affected batches." />
                  <PatternRow tag="conflict" text="Operator log states line clearance was re-performed; SCADA vision system did not record a re-check event." />
                </ul>

                <FindingHead>Historical Similarity</FindingHead>
                <button
                  onClick={() => setDetail({ type: "history", id: "INV-1842" })}
                  className="w-full text-left rounded-md border border-border bg-surface-sunken/50 hover:bg-surface-sunken hover:border-primary/40 transition p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-mono text-[11px] text-muted-foreground">INV-1842 · Q3 2023 · VISK Site</div>
                    <div className="text-mono text-[11px] text-primary">Similarity 0.91 ↗</div>
                  </div>
                  <div className="mt-1.5 text-sm">Particulate excursion on Sterile Line 4 traced to elastomeric leachables from a re-qualified tubing supplier.</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Resolved via supplier requalification + tighter incoming CoA. Effectiveness verified over 6 months.</div>
                </button>

                <FindingHead>Possible Root Causes</FindingHead>
                <div className="space-y-2.5">
                  <HypothesisRow
                    rank={1}
                    title="Silicone tubing lot NR14-0812 introduces particulate load"
                    confidence={0.68}
                    for={[
                      "3 of 3 affected batches use NR14-0812",
                      "Similar profile to INV-1842 leachables case",
                    ]}
                    against={["Incoming CoA within spec"]}
                  />
                  <HypothesisRow
                    rank={2}
                    title="Grade B environmental excursion contaminated aseptic entry"
                    confidence={0.41}
                    for={["Temporal correlation on 09 Jul", "Same corridor as Line 4"]}
                    against={["Excursion resolved in 22 min", "HEPA integrity verified 10 Jul"]}
                  />
                  <HypothesisRow
                    rank={3}
                    title="Line 4 fill needle wear beyond service interval"
                    confidence={0.22}
                    for={["Needle at 96% of service life"]}
                    against={["Preventive maintenance passed 05 Jul"]}
                  />
                </div>

                <FindingHead>Evidence Gaps</FindingHead>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {gaps.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => setDetail({ type: "gap", label: g.label })}
                      className="text-left rounded-md border border-[var(--evidence-gap)]/25 bg-[var(--evidence-gap)]/5 hover:bg-[var(--evidence-gap)]/10 p-3 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] font-medium">{g.label}</div>
                        <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-[var(--evidence-gap)]">{g.priority}</span>
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">{g.why}</div>
                      <div className="mt-1.5 text-mono text-[10.5px] text-muted-foreground">Expected ΔConfidence · +{g.delta}</div>
                    </button>
                  ))}
                </div>

                <FindingHead>Recommended Actions</FindingHead>
                <div className="rounded-md border border-primary/25 bg-primary/[0.04] p-4 space-y-2 text-[13.5px]">
                  <ActionRow tag="Immediate" text="Quarantine batches B24-1187, B24-1189, B24-1194 pending resolution." />
                  <ActionRow tag="Investigate" text="Pull retention samples of NR14-0812 for extractables/leachables re-testing per USP <665>." />
                  <ActionRow tag="Investigate" text="Request supplier deviation log from Nirmalya Rubber for lot NR14-0812." />
                  <ActionRow tag="CAPA draft" text="If hypothesis 1 confirmed, initiate supplier requalification plan (reuse INV-1842 CAPA-887 template)." />
                  <ActionRow tag="Notify" text="Inform Site Head, Regulatory Affairs, and Product Owner within 24h per SOP QA-034 §5.3." />
                </div>
              </Findings>
            </div>
          </section>
        </main>

        {/* RIGHT — Organization Intelligence */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <ColumnHeader eyebrow="Aetheris" title="Organization Intelligence" />

          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            Everything Aetheris knows about the objects in this investigation — assembled from 48,214 documents, 1,204 SOPs, and 3,891 past investigations.
          </p>

          <OrgGroup title="Equipment">
            <OrgItem
              icon="EQ"
              title="Sterile Line 4 · Filling Machine"
              meta="Used in 27 batches · 3 open work orders"
              badges={["Linked to 2 investigations", "Referenced by 4 SOPs"]}
              onClick={() => setDetail({ type: "equipment", name: "Sterile Line 4 · Filling Machine" })}
            />
            <OrgItem icon="EQ" title="HEPA Filter Bank · Grade B Corridor" meta="Last integrity test 10 Jul · pass" badges={["Related CAPA · completed"]} onClick={() => setDetail({ type: "equipment", name: "HEPA Filter Bank · Grade B Corridor" })} />
          </OrgGroup>

          <OrgGroup title="Standard Operating Procedures">
            <OrgItem icon="SOP" title="QA-034 · Deviation Management" meta="Rev 12 · effective 15 Mar '24" badges={["Applied 214 times"]} onClick={() => setDetail({ type: "sop", id: "QA-034" })} />
            <OrgItem icon="SOP" title="MFG-118 · Line 4 Aseptic Fill" meta="Rev 7 · effective 02 Jan '24" badges={["Referenced by INV-1842"]} onClick={() => setDetail({ type: "sop", id: "MFG-118" })} />
          </OrgGroup>

          <OrgGroup title="Historical Investigations">
            <OrgItem
              icon="INV"
              title="INV-1842 · Particulate leachables (2023)"
              meta="Resolved · CAPA effective"
              badges={["Similarity 0.91", "Related CAPA-887"]}
              onClick={() => setDetail({ type: "history", id: "INV-1842" })}
              highlight
            />
            <OrgItem icon="INV" title="INV-1611 · EM excursion cluster (2022)" meta="Resolved via HVAC balancing" badges={["Similarity 0.44"]} onClick={() => setDetail({ type: "history", id: "INV-1611" })} />
          </OrgGroup>

          <OrgGroup title="Batches">
            <OrgItem icon="B" title="B24-1194 · Injectra 1 g" meta="QA Hold · 11 Jul" badges={["Complaint linked"]} onClick={() => setDetail({ type: "batch", id: "B24-1194" })} />
            <OrgItem icon="B" title="B24-1189 · Injectra 1 g" meta="Under review" badges={[]} onClick={() => setDetail({ type: "batch", id: "B24-1189" })} />
            <OrgItem icon="B" title="B24-1187 · Injectra 1 g" meta="Quarantine" badges={[]} onClick={() => setDetail({ type: "batch", id: "B24-1187" })} />
          </OrgGroup>

          <OrgGroup title="Supplier History">
            <OrgItem icon="SP" title="Nirmalya Rubber · NR-14" meta="Involved in INV-1842 · 3 open complaints" badges={["Watchlist"]} />
          </OrgGroup>

          <OrgGroup title="Operator Training & Records">
            <OrgItem icon="TR" title="Line 4 shift roster · 09 Jul" meta="All operators current on MFG-118" badges={["3 operators"]} />
          </OrgGroup>
        </aside>
      </div>

      {/* Detail side panel */}
      <DetailPanel detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

/* -------------------------------- pieces -------------------------------- */

function ColumnHeader({ eyebrow, title, count }: { eyebrow: string; title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</div>
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
      </div>
      {count !== undefined && <span className="text-mono text-[11px] text-muted-foreground">{count} items</span>}
    </div>
  );
}

function StatCell({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${tone === "warn" ? "text-[var(--signal-major)]" : ""}`}>{value}</div>
    </div>
  );
}

function BlockStat({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "warn" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[14px] ${mono ? "text-mono" : ""} ${tone === "warn" ? "text-[var(--signal-major)]" : ""}`}>{value}</div>
    </div>
  );
}

function ProgressLegend({ label, pct, tone }: { label: string; pct: number; tone: "warn" | "ok" }) {
  const toneMap = { warn: "text-[var(--signal-major)]", ok: "text-[var(--signal-ok)]" };
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-mono tabular-nums ${toneMap[tone]}`}>{pct}%</span>
    </div>
  );
}

const evidence = [
  { id: "EV-01", type: "Complaint", title: "Field complaint C-24-0918", meta: "Turkey · reported 08 Jul", quality: "verified", status: "linked", source: "CRM · Complaints" },
  { id: "EV-02", type: "Deviation", title: "DEV-24-0412 · IPC over-limit", meta: "Line 4 · 09 Jul 04:12", quality: "verified", status: "linked", source: "QMS" },
  { id: "EV-03", type: "Deviation", title: "DEV-24-0413 · IPC over-limit", meta: "Line 4 · 10 Jul 05:07", quality: "verified", status: "linked", source: "QMS" },
  { id: "EV-04", type: "Batch Record", title: "eBR · B24-1194", meta: "Injectra 1 g · Line 4", quality: "verified", status: "linked", source: "MES", missing: 2 },
  { id: "EV-05", type: "Equipment Log", title: "Filler SCADA log · Line 4", meta: "08–11 Jul", quality: "partial", status: "linked", source: "SCADA", missing: 1 },
  { id: "EV-06", type: "EM Data", title: "Grade B corridor · 09 Jul", meta: "Excursion 03:41–04:03", quality: "verified", status: "linked", source: "LIMS" },
  { id: "EV-07", type: "Audit Finding", title: "MHRA obs · Q1 2024 §4.2", meta: "Supplier oversight", quality: "verified", status: "referenced", source: "Reg Affairs" },
  { id: "EV-08", type: "Photos", title: "In-line vision captures", meta: "48 frames flagged", quality: "verified", status: "linked", source: "IPC" },
  { id: "EV-09", type: "Supplier", title: "Nirmalya CoA · NR14-0812", meta: "Tubing lot cert", quality: "verified", status: "conflict", source: "SAP MM" },
  { id: "EV-10", type: "Training", title: "Operator training records", meta: "Line 4 · 09 Jul shift", quality: "verified", status: "linked", source: "LMS" },
  { id: "EV-11", type: "Email", title: "Supplier query thread", meta: "Nirmalya · 4 messages", quality: "partial", status: "linked", source: "M365" },
  { id: "EV-12", type: "Environmental", title: "HVAC differential pressure", meta: "Corridor · 09 Jul", quality: "verified", status: "linked", source: "BMS" },
] as const;

function EvidenceCard({ e, active, onClick }: { e: (typeof evidence)[number]; active: boolean; onClick: () => void }) {
  const qMap = {
    verified: "text-[var(--evidence-fact)] border-[var(--evidence-fact)]/30",
    partial: "text-[var(--evidence-gap)] border-[var(--evidence-gap)]/30",
  } as const;
  const statusDot = e.status === "conflict" ? "bg-[var(--evidence-conflict)]" : e.status === "referenced" ? "bg-muted-foreground/50" : "bg-[var(--evidence-fact)]";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border p-3 transition group ${active ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-surface/60 hover:bg-surface hover:border-border/80"}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
        <span className="text-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{e.type}</span>
        <span className="text-mono text-[10.5px] text-muted-foreground/70 ml-auto">{e.id}</span>
      </div>
      <div className="mt-1.5 text-[13px] leading-snug">{e.title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{e.meta}</div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className={`text-mono text-[10px] uppercase tracking-[0.12em] border rounded px-1 py-0.5 ${qMap[e.quality as keyof typeof qMap]}`}>{e.quality}</span>
        {"missing" in e && e.missing ? (
          <span className="text-mono text-[10px] uppercase tracking-[0.12em] border rounded px-1 py-0.5 text-[var(--evidence-gap)] border-[var(--evidence-gap)]/30">
            {e.missing} missing
          </span>
        ) : null}
        {e.status === "conflict" && (
          <span className="text-mono text-[10px] uppercase tracking-[0.12em] border rounded px-1 py-0.5 text-[var(--evidence-conflict)] border-[var(--evidence-conflict)]/40">
            conflict
          </span>
        )}
        <span className="text-mono text-[10px] text-muted-foreground/70 ml-auto">{e.source}</span>
      </div>
    </button>
  );
}

/* Timeline */
function Timeline({ onSelect, selected }: { onSelect: (id: string) => void; selected: string }) {
  const events = [
    { id: "EV-06", t: "09 Jul · 03:41", label: "EM excursion · Grade B corridor", kind: "fact" as const, x: 8 },
    { id: "EV-02", t: "09 Jul · 04:12", label: "IPC particulate over limit · B24-1187", kind: "fact" as const, x: 22 },
    { id: "EV-05", t: "09 Jul · 04:14", label: "Line clearance re-performed (unlogged)", kind: "conflict" as const, x: 24 },
    { id: "EV-03", t: "10 Jul · 05:07", label: "IPC particulate over limit · B24-1189", kind: "fact" as const, x: 52 },
    { id: "EV-09", t: "10 Jul · 09:30", label: "Supplier CoA reviewed (within spec)", kind: "hypothesis" as const, x: 60 },
    { id: "EV-04", t: "11 Jul · 04:22", label: "IPC particulate over limit · B24-1194", kind: "fact" as const, x: 84 },
    { id: "GAP-1", t: "11 Jul · 05:00", label: "QA Release evidence · missing", kind: "gap" as const, x: 90 },
    { id: "EV-01", t: "11 Jul · 06:10", label: "Field complaint reference C-24-0918 linked", kind: "fact" as const, x: 96 },
  ];
  const kindMap = {
    fact: "bg-[var(--evidence-fact)] shadow-[0_0_10px_var(--evidence-fact)]",
    hypothesis: "bg-[var(--evidence-hypothesis)] shadow-[0_0_10px_var(--evidence-hypothesis)]",
    gap: "bg-[var(--evidence-gap)] shadow-[0_0_10px_var(--evidence-gap)]",
    conflict: "bg-[var(--evidence-conflict)] shadow-[0_0_10px_var(--evidence-conflict)]",
  };

  return (
    <div className="mt-4">
      <div className="relative h-28">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {[10, 30, 50, 70, 90].map((x) => (
          <div key={x} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${x}%` }}>
            <div className="h-2 w-px bg-border" />
          </div>
        ))}
        {events.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${e.x}%` }}
          >
            <span className={`block h-2.5 w-2.5 rounded-full ${kindMap[e.kind]} ${selected === e.id ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`} />
            <div className={`absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition text-[11px] bg-popover border border-border rounded px-2 py-1 pointer-events-none z-10 ${selected === e.id ? "opacity-100" : ""}`}>
              <div className="text-mono text-[10px] text-muted-foreground">{e.t}</div>
              <div>{e.label}</div>
            </div>
          </button>
        ))}
        {/* contradiction arc */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M22 50 Q23 24 24 50" stroke="var(--evidence-conflict)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" opacity="0.7" />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>08 Jul</span><span>09 Jul</span><span>10 Jul</span><span>11 Jul (now)</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <LegendDot color="fact" label="Fact" />
        <LegendDot color="hypothesis" label="Hypothesis" />
        <LegendDot color="gap" label="Gap" />
        <LegendDot color="conflict" label="Contradiction" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: "fact" | "hypothesis" | "gap" | "conflict"; label: string }) {
  const map = {
    fact: "bg-[var(--evidence-fact)]",
    hypothesis: "bg-[var(--evidence-hypothesis)]",
    gap: "bg-[var(--evidence-gap)]",
    conflict: "bg-[var(--evidence-conflict)]",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${map[color]}`} />
      {label}
    </span>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function Findings({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}
function FindingHead({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground pt-3 first:pt-0">{children}</div>;
}

function Chip({ color, children }: { color: "fact" | "hypothesis" | "gap" | "conflict"; children: React.ReactNode }) {
  const map = {
    fact: "text-[var(--evidence-fact)] border-[var(--evidence-fact)]/30",
    hypothesis: "text-[var(--evidence-hypothesis)] border-[var(--evidence-hypothesis)]/30",
    gap: "text-[var(--evidence-gap)] border-[var(--evidence-gap)]/30",
    conflict: "text-[var(--evidence-conflict)] border-[var(--evidence-conflict)]/30",
  };
  return <span className={`text-mono text-[10px] uppercase tracking-[0.12em] border rounded px-1.5 py-0.5 ${map[color]}`}>{children}</span>;
}

function PatternRow({ tag, text }: { tag: "fact" | "hypothesis" | "conflict" | "gap"; text: string }) {
  const dot = {
    fact: "bg-[var(--evidence-fact)]",
    hypothesis: "bg-[var(--evidence-hypothesis)]",
    conflict: "bg-[var(--evidence-conflict)]",
    gap: "bg-[var(--evidence-gap)]",
  };
  return (
    <li className="flex items-start gap-3 rounded-md border border-border/60 bg-surface-sunken/40 p-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot[tag]}`} />
      <div className="flex-1 leading-snug text-muted-foreground"><span className="text-foreground">{text}</span></div>
      <Chip color={tag}>{tag}</Chip>
    </li>
  );
}

function HypothesisRow({ rank, title, confidence, for: forList, against }: { rank: number; title: string; confidence: number; for: string[]; against: string[] }) {
  const pct = Math.round(confidence * 100);
  const toneClass = pct >= 60 ? "text-[var(--signal-major)]" : pct >= 40 ? "text-[var(--signal-minor)]" : "text-muted-foreground";
  return (
    <div className="rounded-md border border-border/70 bg-surface-sunken/40 p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="text-mono text-[11px] text-muted-foreground w-6 shrink-0">H{rank}</div>
          <div className="text-[13.5px] font-medium leading-snug">{title}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Confidence</div>
          <div className={`text-mono text-lg tabular-nums ${toneClass}`}>{pct}%</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--evidence-fact)]/90 mb-1.5">Evidence for</div>
          <ul className="space-y-1">
            {forList.map((s) => <li key={s} className="text-muted-foreground"><span className="text-foreground">·</span> {s}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--evidence-conflict)]/90 mb-1.5">Evidence against</div>
          <ul className="space-y-1">
            {against.map((s) => <li key={s} className="text-muted-foreground"><span className="text-foreground">·</span> {s}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-surface-sunken overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[var(--signal-major)]/70 to-[var(--signal-major)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActionRow({ tag, text }: { tag: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{tag}</span>
      <span className="leading-snug">{text}</span>
    </div>
  );
}

const gaps = [
  { label: "QA Release documentation missing", why: "Needed to confirm chain of custody and disposition per SOP QA-034 §4.1.", priority: "High", delta: 12 },
  { label: "Environmental monitoring plate results", why: "Post-excursion micro plates not yet linked from LIMS.", priority: "High", delta: 9 },
  { label: "Supplier confirmation · NR14-0812 lot", why: "Verify whether Nirmalya observed anomalies during manufacture.", priority: "Medium", delta: 7 },
  { label: "Fill needle calibration record", why: "Rule out hypothesis 3 with recent calibration data.", priority: "Low", delta: 4 },
];

/* Organization Intelligence */
function OrgGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="px-3 py-2 border-b border-border/60 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}
function OrgItem({ icon, title, meta, badges, onClick, highlight }: { icon: string; title: string; meta: string; badges: string[]; onClick?: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2.5 hover:bg-accent/40 transition ${highlight ? "bg-primary/[0.05]" : ""}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-mono text-[10px] uppercase tracking-[0.14em] h-6 w-8 rounded bg-surface-sunken border border-border grid place-items-center text-muted-foreground shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] leading-snug">{title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{meta}</div>
          {badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {badges.map((b) => (
                <span key={b} className="text-[10.5px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-surface/60">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* Detail side panel */
function DetailPanel({ detail, onClose }: { detail: DetailKind; onClose: () => void }) {
  const open = detail !== null;
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen w-full max-w-[560px] panel-elevated rounded-none border-l overflow-y-auto transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {detail && (
          <div className="stream-in">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border/70 bg-background/85 backdrop-blur-xl">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {detail.type === "equipment" && "Equipment profile"}
                  {detail.type === "history" && "Historical investigation"}
                  {detail.type === "batch" && "Manufacturing journey"}
                  {detail.type === "gap" && "Evidence gap"}
                  {detail.type === "sop" && "Standard operating procedure"}
                </div>
                <div className="mt-0.5 text-[15px] font-medium tracking-tight">
                  {detail.type === "equipment" && detail.name}
                  {detail.type === "history" && `${detail.id} · Particulate leachables`}
                  {detail.type === "batch" && `Batch ${detail.id}`}
                  {detail.type === "gap" && detail.label}
                  {detail.type === "sop" && detail.id}
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-md border border-border hover:bg-accent grid place-items-center">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {detail.type === "equipment" && <EquipmentDetail name={detail.name} />}
              {detail.type === "history" && <HistoryDetail id={detail.id} />}
              {detail.type === "batch" && <BatchDetail id={detail.id} />}
              {detail.type === "gap" && <GapDetail label={detail.label} />}
              {detail.type === "sop" && <SopDetail id={detail.id} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[13px]">{value}</div>
    </div>
  );
}

function EquipmentDetail({ name }: { name: string }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <KV label="Asset tag" value="VISK-SB-L4-FIL-01" />
        <KV label="Manufacturer" value="OPTIMA Machinery" />
        <KV label="Commissioned" value="14 Feb 2020" />
        <KV label="Validation status" value="Qualified · re-val due Q4 '24" />
        <KV label="Owner" value="Manufacturing · Sterile Ops" />
        <KV label="Criticality" value="Direct impact · GxP" />
      </div>
      <Section title="Maintenance history">
        {[
          ["11 Jun '24", "Preventive maintenance · pass", "ok"],
          ["05 Jul '24", "Fill needle inspection · 96% life", "warn"],
          ["01 Feb '24", "Annual overhaul · vendor OPTIMA", "ok"],
        ].map(([d, t, tone]) => (
          <Row key={d} left={d} right={t as string} tone={tone as any} />
        ))}
      </Section>
      <Section title="Calibration">
        <Row left="Torque sensor A" right="In tolerance · 03 Jul" tone="ok" />
        <Row left="Fill volume LVDT" right="In tolerance · 03 Jul" tone="ok" />
        <Row left="Speed encoder" right="Due · 20 Jul" tone="warn" />
      </Section>
      <Section title="Recent deviations & events">
        <Row left="09 Jul · DEV-24-0412" right="Particulate over limit" tone="crit" />
        <Row left="10 Jul · DEV-24-0413" right="Particulate over limit" tone="crit" />
        <Row left="12 Feb · DEV-23-1122" right="Vial jam · recovered" tone="warn" />
      </Section>
      <Section title="Impact radius">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Sterile Line 4 supplies aseptic fill for Injectra 1 g, Injectra 500 mg, and Cerivax. Any disposition impacts <span className="text-foreground">7 SKUs</span>, <span className="text-foreground">27 batches</span> in the last 90 days, and <span className="text-foreground">4 markets</span> with regulatory notification thresholds.
        </p>
      </Section>
      <Section title="Connected SOPs">
        <Row left="MFG-118" right="Line 4 aseptic fill" />
        <Row left="MNT-041" right="Fill needle service" />
        <Row left="CAL-017" right="Speed encoder calibration" />
      </Section>
    </>
  );
}

function HistoryDetail({ id }: { id: string }) {
  return (
    <>
      <div className="rounded-md border border-primary/25 bg-primary/[0.05] px-3 py-2 text-[12px]">
        <span className="text-primary text-mono">Similarity 0.91</span>
        <span className="text-muted-foreground"> · This investigation closely mirrors the current signal.</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <KV label="Reference" value={id} />
        <KV label="Opened" value="14 Aug 2023" />
        <KV label="Closed" value="02 Nov 2023" />
        <KV label="Outcome" value="Root cause confirmed · CAPA effective" />
      </div>
      <Section title="Problem statement">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Particulate excursion detected across four consecutive batches of Injectra 1 g on Sterile Line 4. In-process observations exceeded trending limits by 3.1×.
        </p>
      </Section>
      <Section title="Timeline">
        <Row left="14 Aug" right="First IPC deviation" />
        <Row left="19 Aug" right="Supplier tubing lot correlated" />
        <Row left="03 Sep" right="Extractables testing per USP <665>" />
        <Row left="28 Sep" right="Supplier CAPA aligned" />
        <Row left="02 Nov" right="CAPA-887 verified effective" />
      </Section>
      <Section title="Root cause">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Batch of silicone tubing exhibited elevated leachables outside the qualified supplier range due to a curing process deviation at the supplier's plant.
        </p>
      </Section>
      <Section title="Corrective actions">
        <Row left="CAPA-887" right="Supplier requalification programme" />
        <Row left="CAPA-889" right="Tighten incoming CoA · leachables field mandatory" />
        <Row left="CAPA-891" right="Add extractables re-test on lot change" />
      </Section>
      <Section title="Effectiveness verification">
        <Row left="6-month review" right="No recurrence · closed 02 May '24" tone="ok" />
      </Section>
    </>
  );
}

function BatchDetail({ id }: { id: string }) {
  const stages = [
    { name: "Raw Material", status: "Released", tone: "ok" },
    { name: "Manufacturing", status: "Complete", tone: "ok" },
    { name: "Aseptic Fill", status: "IPC excursion", tone: "crit" },
    { name: "Packaging", status: "Complete", tone: "ok" },
    { name: "QA Hold", status: "Active", tone: "warn" },
    { name: "Distribution", status: "Blocked", tone: "crit" },
    { name: "Complaint", status: "1 linked · C-24-0918", tone: "warn" },
    { name: "Investigation", status: "INV-2041 open", tone: "warn" },
  ] as const;
  const toneMap = {
    ok: "border-[var(--signal-ok)]/40 bg-[var(--signal-ok)]/8 text-[var(--signal-ok)]",
    warn: "border-[var(--signal-major)]/40 bg-[var(--signal-major)]/8 text-[var(--signal-major)]",
    crit: "border-[var(--signal-critical)]/40 bg-[var(--signal-critical)]/8 text-[var(--signal-critical)]",
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <KV label="Batch" value={id} />
        <KV label="Product" value="Injectra 1 g" />
        <KV label="Line" value="Sterile Line 4" />
        <KV label="Filled on" value="11 Jul 2024 · 04:00 IST" />
        <KV label="Batch size" value="24,000 vials" />
        <KV label="Status" value="QA Hold" />
      </div>
      <Section title="Manufacturing journey">
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="text-mono text-[10px] text-muted-foreground w-4">{String(i + 1).padStart(2, "0")}</div>
              <div className={`flex-1 rounded-md border px-3 py-2 flex items-center justify-between ${toneMap[s.tone]}`}>
                <span className="text-[13px] text-foreground">{s.name}</span>
                <span className="text-mono text-[11px]">{s.status}</span>
              </div>
              {i < stages.length - 1 && <div />}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function GapDetail({ label }: { label: string }) {
  return (
    <>
      <div className="rounded-md border border-[var(--evidence-gap)]/30 bg-[var(--evidence-gap)]/8 p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--evidence-gap)]">Evidence gap · High priority</div>
        <div className="mt-1 text-[14px]">{label}</div>
      </div>
      <Section title="Why this evidence matters">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Without this evidence, Helix cannot fully verify chain of custody or disposition history. Two hypotheses remain in a range where confirmation depends on this artifact.
        </p>
      </Section>
      <Section title="Expected impact">
        <Row left="Confidence gain" right="+12%" tone="ok" />
        <Row left="Hypotheses affected" right="H1, H2" />
        <Row left="Regulatory relevance" right="21 CFR 211.192" />
      </Section>
      <Section title="Suggested collection">
        <Row left="Owner" right="QA Operations · P. Iyer" />
        <Row left="Source" right="MES + eQMS release module" />
        <Row left="SLA" right="4 hours" />
      </Section>
      <button className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium">Request evidence</button>
    </>
  );
}

function SopDetail({ id }: { id: string }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <KV label="Document" value={id} />
        <KV label="Revision" value="Rev 12" />
        <KV label="Effective" value="15 Mar 2024" />
        <KV label="Owner" value="Quality Assurance" />
      </div>
      <Section title="Referenced in this investigation">
        <Row left="§4.1" right="Chain of custody · QA release" />
        <Row left="§5.3" right="Escalation for major quality signals" />
      </Section>
      <Section title="Related">
        <Row left="INV-1842" right="Applied same escalation path" />
        <Row left="CAPA-887" right="Owner reference" />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ left, right, tone }: { left: string; right: string; tone?: "ok" | "warn" | "crit" }) {
  const toneMap = { ok: "text-[var(--signal-ok)]", warn: "text-[var(--signal-major)]", crit: "text-[var(--signal-critical)]" } as const;
  return (
    <div className="flex items-center justify-between text-[13px] py-1.5 border-b border-border/50 last:border-0">
      <span className="text-mono text-[11.5px] text-muted-foreground">{left}</span>
      <span className={tone ? toneMap[tone] : ""}>{right}</span>
    </div>
  );
}
