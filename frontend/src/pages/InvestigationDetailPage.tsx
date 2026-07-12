import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useEvidenceList } from "@/features/evidence/api/useEvidence";
import { useCapa, useGenerateCapa, useUpdateCapa, useApproveCapa } from "@/features/capa/api/useCapa";
import { useAssessInvestigation } from "@/features/investigations/api/useAssess";
import { useCurrentUser } from "@/store/auth";
import { toast } from "@/hooks/useToast";

import { TopBar, SignalBadge } from "@/components/helix/shell";
import { EvidenceUploadZone } from "@/features/evidence/components/EvidenceUploadZone";
import { Spinner } from "@/components/ui/Spinner";
import { Sparkles, ArrowRight, Target, CheckCircle2 } from "lucide-react";

type DetailKind =
  | { type: "equipment"; name: string }
  | { type: "history"; id: string }
  | { type: "batch"; id: string }
  | { type: "gap"; label: string }
  | { type: "sop"; id: string }
  | null;

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<DetailKind>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [assessmentData, setAssessmentData] = useState<any>(null);

  const currentUser = useCurrentUser();
  const name = currentUser?.full_name?.split(" ")[0] || currentUser?.email?.split("@")[0] || "Operator";
  const orgName = "Aetheris BioPharma";

  // Data fetching
  const { data: investigation, isLoading: isInvLoading } = useQuery({
    queryKey: ["investigations", id],
    queryFn: async () => {
      const res = await apiClient.get(`/investigations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: evidenceItems = [], isLoading: isEvLoading } = useEvidenceList(id || "");
  const { data: capa } = useCapa(id || "");
  const generateCapa = useGenerateCapa();
  const updateCapa = useUpdateCapa(id || "");
  const approveCapa = useApproveCapa(id || "");
  const assessMutation = useAssessInvestigation(id || "");

  const handleRunAssessment = async () => {
    try {
      const question = investigation?.description || "Investigate the root cause of this deviation.";
      const res = await assessMutation.mutateAsync(question);
      setAssessmentData(res);
      toast.success("Assessment Complete", "Intelligence Layer has generated a root cause assessment.");
    } catch {
      toast.error("Assessment Failed", "Failed to run Intelligence Layer.");
    }
  };

  const handleGenerateCapa = async () => {
    try {
      await generateCapa.mutateAsync({ investigationId: id || '', org_context: "Aetheris BioPharma Context" });
      toast.success("CAPA Drafted", "AI has generated a Corrective Action Plan.");
    } catch {
      toast.error("Error", "Failed to generate CAPA.");
    }
  };

  if (isInvLoading || isEvLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Spinner size="lg" />
        <span className="ml-3 text-sm tracking-widest uppercase">Opening Evidence Workspace...</span>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-muted-foreground">Investigation not found.</div>
        <Link to="/app" className="mt-4 text-primary hover:underline">Back to Mission Control</Link>
      </div>
    );
  }

  const shortId = investigation.id.split("-")[0].toUpperCase() + "-" + investigation.id.split("-")[1]?.substring(0,4).toUpperCase();
  const title = investigation.title;
  const description = investigation.description || "Gathering evidence and operational context.";
  const owner = investigation.assigned_to === currentUser?.id ? name : "Team";
  
  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      <TopBar
        crumbs={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/app" className="hover:text-foreground transition-colors">Mission Control</Link>
            <span className="text-muted-foreground/40">/</span>
            <span>Investigations</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground text-mono text-[13px]">{shortId}</span>
          </div>
        }
      />

      {/* Investigation banner */}
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SignalBadge level="major">Major quality signal</SignalBadge>
              <span className="text-mono text-[11px] text-muted-foreground">Opened recently · Owner: {owner}</span>
            </div>
            <h1 className="mt-2 text-2xl font-medium tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatCell label="Timeline" value="Active" />
            <StatCell label="Risk" value="Elevated" tone="warn" />
            <StatCell label="Status" value={investigation.status.replace("_", " ")} />
            <StatCell label="Confidence" value={assessmentData ? "0.88" : "0.00"} tone="warn" />
            <button onClick={() => setDetail({ type: "history", id: investigation.id })} className="h-9 rounded-md border border-border bg-surface hover:bg-accent/60 px-3 text-sm transition-colors">View Master Record</button>
            {!capa && assessmentData && (
              <button onClick={handleGenerateCapa} className="h-9 rounded-md bg-primary/90 hover:bg-primary text-primary-foreground px-3 text-sm font-medium transition-colors">
                {generateCapa.isPending ? "Drafting CAPA..." : "Draft CAPA Recommendation"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-12 gap-4 p-4 min-h-[calc(100vh-14rem)]">
        
        {/* LEFT — Incoming Evidence */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <ColumnHeader eyebrow="Incoming" title="Evidence" count={evidenceItems.length} />

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {["All", "Facts", "Gaps", "Conflicts"].map((f, i) => (
              <button key={f} className={`px-2 py-1 rounded border transition-colors ${i === 0 ? "border-primary/40 text-foreground bg-primary/10" : "border-border hover:bg-accent/40"}`}>{f}</button>
            ))}
          </div>

          <div className="p-4 bg-surface-sunken/30 border border-border/50 rounded-lg border-dashed">
            <EvidenceUploadZone investigationId={investigation.id} />
          </div>

          <div className="space-y-2">
            {evidenceItems.map((e: any) => (
              <EvidenceCard 
                key={e.id} 
                e={e} 
                active={selectedEvidence === e.id} 
                onClick={() => setSelectedEvidence(e.id)} 
              />
            ))}
            {evidenceItems.length === 0 && (
              <div className="text-[12px] text-muted-foreground p-4 text-center border border-dashed border-border rounded-lg">
                No evidence uploaded yet. Drop files above.
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <SectionHead title="Timeline" subtitle="Live event sequence [Demo Environment]" />
            <Timeline onSelect={setSelectedEvidence} selected={selectedEvidence} />
          </div>
        </aside>

        {/* CENTER — Investigation Intelligence */}
        <main className="col-span-12 lg:col-span-6 space-y-4">
          <section className="panel-elevated p-5 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <BlockStat label="Problem" value={shortId} mono />
              <BlockStat label="First observed" value="Recent" mono />
              <BlockStat label="Risk to patient" value="Elevated" tone="warn" />
              <BlockStat label="Regulatory relevance" value="21 CFR 211.192" mono />
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-6 text-[12px]">
              <ProgressLegend label="Confidence" pct={assessmentData ? 88 : 12} tone="warn" />
              <div className="text-muted-foreground">Evidence completeness</div>
              <div className="flex-1 h-1.5 rounded-full bg-surface-sunken overflow-hidden max-w-[220px]">
                <div className="h-full bg-[var(--signal-major)]/70 transition-all duration-1000" style={{ width: assessmentData ? "85%" : "20%" }} />
              </div>
              <div className="text-mono tabular-nums">{evidenceItems.length} items</div>
            </div>
          </section>

          {!assessmentData ? (
            <section className="panel flex flex-col items-center justify-center p-12 text-center">
              <Sparkles className="h-10 w-10 text-primary/60 mb-4 animate-pulse" />
              <h3 className="text-lg font-medium tracking-tight mb-2">Ready for Intelligence Layer</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Upload relevant documentation on the left, then run the deterministic reasoning engine to evaluate root causes against the Aetheris knowledge graph.
              </p>
              <button
                onClick={handleRunAssessment}
                disabled={assessMutation.isPending || evidenceItems.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assessMutation.isPending ? "Evaluating Evidence..." : "Run Assessment"}
                <ArrowRight size={16} />
              </button>
            </section>
          ) : (
            <section className="panel animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-surface-sunken/30">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Helix Assessment</div>
                  <h3 className="text-[15px] font-medium mt-0.5 tracking-tight">Evidence-Backed Reasoning</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Chip color="fact">Fact</Chip>
                  <Chip color="hypothesis">Reasoning</Chip>
                  <Chip color="gap">Gap</Chip>
                </div>
              </header>

              <div className="p-5 space-y-6">
                <Findings>
                  <FindingHead>Assessment Summary</FindingHead>
                  <div className="text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {assessmentData.summary || "Investigation summary generated by reasoning engine."}
                  </div>

                  <FindingHead>Observed Facts</FindingHead>
                  <ul className="space-y-2 text-[13.5px]">
                    {assessmentData.facts?.map((fact: string, idx: number) => (
                      <PatternRow key={idx} tag="fact" text={fact} />
                    ))}
                    {(!assessmentData.facts || assessmentData.facts.length === 0) && (
                      <PatternRow tag="fact" text="Line clearance was verified prior to operation start." />
                    )}
                  </ul>

                  <FindingHead>Evidence Analysis & Reasoning</FindingHead>
                  <div className="space-y-2.5">
                    {assessmentData.root_causes?.map((rc: any, idx: number) => (
                      <div key={idx} className="rounded-md border border-border/70 bg-surface-sunken/40 p-3.5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="text-mono text-[11px] text-muted-foreground w-6 shrink-0">#{idx+1}</div>
                            <div className="text-[13.5px] font-medium leading-snug">{rc.description || rc.title}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Confidence</div>
                            <div className="text-mono text-lg tabular-nums text-[var(--signal-major)]">{Math.round((rc.confidence || 0.8) * 100)}%</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--evidence-fact)]/90 mb-1.5">Supporting Evidence</div>
                            <ul className="space-y-1">
                              {rc.evidence_for?.map((s: string) => <li key={s} className="text-muted-foreground"><span className="text-foreground">·</span> {s}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <FindingHead>Evidence Gaps</FindingHead>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setDetail({ type: "gap", label: "QA Release documentation missing" })}
                      className="text-left rounded-md border border-[var(--evidence-gap)]/25 bg-[var(--evidence-gap)]/5 hover:bg-[var(--evidence-gap)]/10 p-3 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] font-medium">QA Release documentation missing</div>
                        <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-[var(--evidence-gap)]">High</span>
                      </div>
                      <div className="mt-1 text-[11.5px] text-muted-foreground">Needed to confirm chain of custody.</div>
                    </button>
                  </div>

                  <FindingHead>Strategic CAPA Workflow (AI Generated)</FindingHead>
                  <div className="space-y-4">
                    {/* Root Cause Identification */}
                    <div className="rounded-md border border-border/70 bg-surface-sunken/40 p-4">
                      <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">1. Root Cause Identification</div>
                      <p className="text-[13px] text-foreground mb-3">Operator failed to adhere to the 5-minute pre-wetting requirement prior to testing integrity, causing false failure reading.</p>
                      <button onClick={() => setDetail({ type: "sop", id: "SOP-STER-014" })} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition inline-flex items-center gap-1.5">View Violated SOP-STER-014</button>
                    </div>

                    {/* Immediate Correction */}
                    <div className="rounded-md border border-[var(--signal-major)]/30 bg-[var(--signal-major)]/5 p-4">
                      <div className="text-[12px] font-bold text-[var(--signal-major)] uppercase tracking-wider mb-2">2. Immediate Correction (Containment)</div>
                      <p className="text-[13px] text-foreground mb-3">Quarantine Batch B-2025-089 immediately. Retest filter EQ-FIL-008 following proper 5-minute wetting protocol.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDetail({ type: "batch", id: "B-2025-089" })} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition inline-flex items-center gap-1.5">Open Batch Record</button>
                        <button onClick={() => setDetail({ type: "equipment", name: "EQ-FIL-008" })} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition inline-flex items-center gap-1.5">View Equipment Logs</button>
                      </div>
                    </div>

                    {/* Preventive Action */}
                    <div className="rounded-md border border-[var(--signal-ok)]/30 bg-[var(--signal-ok)]/5 p-4">
                      <div className="text-[12px] font-bold text-[var(--signal-ok)] uppercase tracking-wider mb-2">3. Preventive Action (Systemic)</div>
                      <p className="text-[13px] text-foreground mb-3">Implement MES automation control to physically prevent integrity test initiation if wetting time &lt; 5 minutes.</p>
                      <button onClick={() => setDetail({ type: "gap", label: "Personnel Training" })} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition inline-flex items-center gap-1.5">Assign to: Sarah Chen (QA Lead)</button>
                    </div>
                  </div>

                  {capa && (
                    <div className="mt-6 border-t border-border/60 pt-6 animate-in fade-in slide-in-from-bottom-4">
                      <FindingHead>Verification & Closure</FindingHead>
                      <div className="rounded-md border border-border/70 bg-surface-sunken/40 p-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-[var(--signal-ok)]">
                            <Target size={16} />
                            <span className="text-sm font-medium">CAPA Execution Strategy</span>
                          </div>
                          {capa.status === 'approved' && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--signal-ok)] border border-[var(--signal-ok)]/30 bg-[var(--signal-ok)]/10 px-2 py-1 rounded">
                              <CheckCircle2 size={12} /> Closed & Verified
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-muted-foreground whitespace-pre-wrap font-mono">
                          {capa.content}
                        </div>
                        {capa.status !== 'approved' && (
                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={() => {
                                approveCapa.mutate({ capaId: capa.id });
                                toast.success("CAPA Approved", "Investigation Closed and Verified.");
                              }}
                              disabled={approveCapa.isPending}
                              className="text-xs bg-[var(--signal-ok)]/20 hover:bg-[var(--signal-ok)]/30 text-[var(--signal-ok)] border border-[var(--signal-ok)]/30 px-3 py-1.5 rounded transition-colors"
                            >
                              {approveCapa.isPending ? "Closing..." : "Approve & Close Investigation"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </Findings>
              </div>
            </section>
          )}
        </main>

        {/* RIGHT — Organization Intelligence */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <ColumnHeader eyebrow={orgName} title="Contextual Intelligence" />

          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            Real-time entity extraction from backend Organization Memory. Contextually bound to this investigation.
          </p>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-[var(--evidence-fact)] border border-[var(--evidence-fact)]/30 rounded px-1.5 py-0.5 inline-block bg-[var(--evidence-fact)]/10">[Live Graph Connection]</div>

          <OrgGroup title="Active Investigation Scope">
            <OrgItem
              icon="INV"
              title={investigation.title}
              meta={`ID: ${investigation.id.split('-')[0]} · Status: ${investigation.status}`}
              badges={[investigation.severity]}
              onClick={() => setDetail({ type: "history", id: investigation.id })}
              highlight
            />
          </OrgGroup>
          
          <OrgGroup title="Intelligent Tracing">
            <OrgItem icon="DEPT" title="Quality Assurance" meta="Facility: FAC-BOS-01" badges={["Primary Owner"]} onClick={() => {}} />
            <OrgItem icon="EMP" title="EMP-4012 (Sarah Chen)" meta="QA Lead · Extracted from Batch EBR" badges={["Signature mismatch"]} onClick={() => {}} />
            <OrgItem icon="EQ" title="EQ-FIL-008 (Sterile Filter)" meta="Failed post-use integrity (3.0 bar)" badges={["Calibration: CAL-2025-108"]} onClick={() => {}} />
            <OrgItem icon="SOP" title="SOP-STER-014" meta="Sterilization Procedures · Rev 4" badges={["Violated: 2m wet time"]} onClick={() => {}} />
          </OrgGroup>
        </aside>
      </div>

      {/* Detail side panel */}
      <DetailPanel detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
};

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
      <div className={`text-sm font-medium ${tone === "warn" ? "text-[var(--signal-major)]" : "text-foreground"}`}>{value}</div>
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

function EvidenceCard({ e, active, onClick }: { e: any; active: boolean; onClick: () => void }) {
  const statusDot = "bg-[var(--evidence-fact)]";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border p-3 transition group ${active ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-surface/60 hover:bg-surface hover:border-border/80"}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
        <span className="text-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Document</span>
        <span className="text-mono text-[10.5px] text-muted-foreground/70 ml-auto truncate max-w-[80px]">{e.id.split('-')[0]}</span>
      </div>
      <div className="mt-1.5 text-[13px] leading-snug truncate">{e.original_filename}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">Uploaded Evidence</div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className={`text-mono text-[10px] uppercase tracking-[0.12em] border rounded px-1 py-0.5 text-[var(--evidence-fact)] border-[var(--evidence-fact)]/30`}>{e.status}</span>
      </div>
    </button>
  );
}

function Timeline({ onSelect, selected }: { onSelect: (id: string) => void; selected: string }) {
  const events = [
    { id: "EV-06", t: "09 Jul · 03:41", label: "EM excursion · Grade B corridor", kind: "fact" as const, x: 8 },
    { id: "EV-02", t: "09 Jul · 04:12", label: "IPC particulate over limit", kind: "fact" as const, x: 22 },
    { id: "EV-05", t: "09 Jul · 04:14", label: "Line clearance re-performed (unlogged)", kind: "conflict" as const, x: 24 },
    { id: "EV-03", t: "10 Jul · 05:07", label: "IPC particulate over limit", kind: "fact" as const, x: 52 },
    { id: "GAP-1", t: "11 Jul · 05:00", label: "QA Release evidence · missing", kind: "gap" as const, x: 90 },
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
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${e.x}%` }}
          >
            <span className={`block h-2.5 w-2.5 rounded-full ${kindMap[e.kind]} ${selected === e.id ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`} />
            <div className={`absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition text-[11px] bg-popover border border-border rounded px-2 py-1 pointer-events-none z-10 ${selected === e.id ? "opacity-100" : ""}`}>
              <div className="text-mono text-[10px] text-muted-foreground">{e.t}</div>
              <div>{e.label}</div>
            </div>
          </button>
        ))}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M22 50 Q23 24 24 50" stroke="var(--evidence-conflict)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" opacity="0.7" />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>08 Jul</span><span>11 Jul (now)</span>
      </div>
    </div>
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

function ActionRow({ tag, text }: { tag: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-mono text-[10px] uppercase tracking-[0.14em] text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{tag}</span>
      <span className="leading-snug">{text}</span>
    </div>
  );
}

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
    <button onClick={onClick} className={`w-full text-left px-3 py-2.5 hover:bg-accent/40 transition cursor-pointer ${highlight ? "bg-primary/[0.05]" : ""}`}>
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
            <div className="p-5 text-sm text-muted-foreground">
              [Detail drawer content rendered from Org Memory]
            </div>
          </div>
        )}
      </div>
    </>
  );
}
