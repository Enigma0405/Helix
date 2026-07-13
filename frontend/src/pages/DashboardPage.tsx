import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopBar, SignalBadge, Metric } from "@/components/helix/shell";
import { useInvestigations } from "@/features/investigations/api/useInvestigations";
import { useCurrentUser } from "@/store/auth";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowRight, Database, FileText, Activity, AlertCircle, ShieldAlert, CheckCircle2, History, Network, FileCheck, Layers, Target, UploadCloud } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { data: investigationsRes, isLoading } = useInvestigations();
  const currentUser = useCurrentUser();
  
  const [timelineStep, setTimelineStep] = useState(0);
  const [graphModal, setGraphModal] = useState<any>(null);
  
  useEffect(() => {
    if (timelineStep > 0 && timelineStep < 10) {
      const timer = setTimeout(() => {
        setTimelineStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [timelineStep]);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm tracking-widest uppercase">Initializing Operational Intelligence...</span>
      </div>
    );
  }

  const name = currentUser?.full_name?.split(" ")[0] || currentUser?.email?.split("@")[0] || "Operator";
  const orgName = "Aetheris BioPharma";
  
  const investigations = investigationsRes?.items || [];
  
  // Real active investigations
  const queue = investigations.filter((i: any) => i.status !== "closed").map((i: any) => ({
    id: i.id.split("-")[0].toUpperCase() + "-" + i.id.split("-")[1]?.substring(0,4).toUpperCase(), 
    realId: i.id,
    title: i.title,
    stage: i.status === "pending_review" ? "Hypothesis review" : "Evidence gathering",
    owner: i.assigned_to === currentUser?.id ? name : "Team",
    status: i.status === "pending_review" ? "Review" : "Active",
    level: i.status === "pending_review" ? "minor" : "major",
    evidenceCount: Math.floor(Math.random() * 5) + 2, 
  }));

  const activeCapas = queue.length > 0 ? 1 : 0; 

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTimelineStep(1);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-700 pb-20 relative">
      <TopBar
        crumbs={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hyderabad · VISK Site</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">Mission Control</span>
          </div>
        }
      />

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <div className="text-mono text-[11px] uppercase tracking-[0.22em] text-primary">Enterprise Operational Intelligence</div>
            <h1 className="mt-2 text-[28px] font-medium tracking-tight">{getGreeting()}, {name}.</h1>
            <p className="mt-2 text-[14.5px] font-medium text-foreground max-w-3xl">
              Enterprise Intelligence is continuously updated as operational events are verified against organizational knowledge.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/app/investigations'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1.5 px-4 rounded flex items-center gap-2 text-sm transition-colors shrink-0"
          >
            + Escalate Manual Event
          </button>
        </div>
      </div>

      {/* --- PIPELINE STAGE 1: Enterprise Knowledge --- */}
      <div className="px-6 mt-6">
        <div className="panel p-5 bg-gradient-to-r from-surface to-background relative overflow-hidden border-border/80">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <Database className="text-primary h-5 w-5" />
              <h2 className="text-lg font-medium tracking-tight">Enterprise Knowledge</h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-surface-sunken">Powered by Organization Memory</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl mb-6 leading-relaxed relative z-10">
            The trusted baseline of {orgName}. Incoming operational events are continuously verified against this canonical knowledge graph to detect anomalies.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Approved SOPs</div>
              <div className="text-xl font-medium tabular-nums">1,204</div>
            </div>
            <div className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Equipment Specs</div>
              <div className="text-xl font-medium tabular-nums">612</div>
            </div>
            <div className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Regulatory Rules</div>
              <div className="text-xl font-medium tabular-nums">8,441</div>
            </div>
            <div className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Supplier Profiles</div>
              <div className="text-xl font-medium tabular-nums">148</div>
            </div>
            <div className="border-l-2 border-[var(--signal-ok)] pl-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--signal-ok)] mb-1">Historical CAPAs</div>
              <div className="text-xl font-medium tabular-nums text-[var(--signal-ok)]">3,891</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-2 text-muted-foreground/30">
        <ArrowRight className="rotate-90 h-6 w-6" />
      </div>

      {/* --- PIPELINE STAGE 2 & 3: Live Operations --- */}
      <div className="px-6">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Activity className="text-blue-400 h-5 w-5" />
          <h2 className="text-lg font-medium tracking-tight">Live Operations Pipeline</h2>
          <span className="text-[10px] uppercase tracking-widest text-blue-400/80 border border-blue-400/20 px-2 py-0.5 rounded-full bg-blue-400/5">Continuous Monitoring</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column 1: Incoming Events */}
          <section className="panel h-full border-border/60">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-sunken/30">
              <h3 className="text-[13px] font-medium tracking-tight flex items-center gap-2"><Layers size={14} className="text-muted-foreground" /> Incoming Events</h3>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-surface">Ingestion</span>
            </header>
            <div className="p-4 space-y-3">
              {timelineStep > 0 && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <EventCard 
                    title="Environmental Monitoring Report" 
                    source="Direct Upload"
                    meta="Grade B Corridor · Just now"
                    icon={<FileText size={14} />}
                    pulse={timelineStep < 9}
                  />
                </div>
              )}
              <label className="text-xs bg-surface-sunken border border-border/80 px-3 py-3 rounded-lg hover:border-primary/50 transition cursor-pointer flex flex-col items-center justify-center text-muted-foreground gap-2 border-dashed">
                <input type="file" className="hidden" onChange={handleUpload} />
                <UploadCloud size={18} />
                <span>Click to Upload New Document</span>
              </label>
            </div>
          </section>

          {/* Column 2: Cross Verification */}
          <section className="panel h-full border-border/60 relative overflow-hidden flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-sunken/30 relative z-10 shrink-0">
              <h3 className="text-[13px] font-medium tracking-tight flex items-center gap-2"><Network size={14} className="text-muted-foreground" /> AI Verification & Cross Validation</h3>
              <span className="text-[9px] uppercase tracking-widest text-[var(--signal-ok)] border border-[var(--signal-ok)]/30 px-1.5 py-0.5 rounded bg-[var(--signal-ok)]/10 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full bg-[var(--signal-ok)] ${timelineStep > 0 && timelineStep < 9 ? 'animate-pulse' : ''}`} /> Live
              </span>
            </header>
            <div className="p-4 relative z-10 flex-1 flex flex-col justify-end bg-[#0a0a0a] text-mono">
              <div className="space-y-3 text-[11px] font-mono">
                {timelineStep === 0 && <div className="text-muted-foreground/30 text-center py-4">Awaiting operational events...</div>}
                
                {timelineStep >= 1 && <div className="flex gap-3 text-muted-foreground animate-in slide-in-from-bottom-2"><span className="text-foreground/40 shrink-0">14:10</span> <span>Event document received</span></div>}
                {timelineStep >= 2 && <div className="flex gap-3 text-muted-foreground animate-in slide-in-from-bottom-2"><span className="text-foreground/40 shrink-0">14:10</span> <span>Parsing and entity extraction completed</span></div>}
                {timelineStep >= 3 && <div className="flex gap-3 text-[var(--signal-ok)] animate-in slide-in-from-bottom-2"><span className="text-[var(--signal-ok)]/50 shrink-0">14:11</span> <span>Enterprise Knowledge updated</span></div>}
                {timelineStep >= 4 && <div className="flex gap-3 text-foreground/80 animate-in slide-in-from-bottom-2"><span className="text-foreground/40 shrink-0">14:11</span> <span>Related SOPs identified (SOP-ENV-044)</span></div>}
                {timelineStep >= 5 && <div className="flex gap-3 text-foreground/80 animate-in slide-in-from-bottom-2"><span className="text-foreground/40 shrink-0">14:11</span> <span>Historical CAPA matched (CAPA-2023-081)</span></div>}
                {timelineStep >= 6 && <div className="flex gap-3 text-[var(--signal-major)] animate-in slide-in-from-bottom-2"><span className="text-[var(--signal-major)]/50 shrink-0">14:12</span> <span>Action limit exceeded (Grade B, 6 CFU)</span></div>}
                {timelineStep >= 7 && <div className="flex gap-3 text-amber-400 animate-in slide-in-from-bottom-2"><span className="text-amber-400/50 shrink-0">14:12</span> <span>Operational Signal generated</span></div>}
                {timelineStep >= 8 && <div className="flex gap-3 text-[var(--signal-major)] animate-in slide-in-from-bottom-2"><span className="text-[var(--signal-major)]/50 shrink-0">14:12</span> <span>Investigation created automatically</span></div>}
                {timelineStep >= 9 && <div className="flex gap-3 text-foreground animate-in slide-in-from-bottom-2"><span className="text-foreground/40 shrink-0">14:12</span> <span>Assigning to QA Lead...</span></div>}
              </div>
            </div>
          </section>

          {/* Column 3: Operational Signals */}
          <section className="panel h-full border-border/60 border-r-[3px] border-r-[var(--signal-major)]/50">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-sunken/30">
              <h3 className="text-[13px] font-medium tracking-tight flex items-center gap-2"><AlertCircle size={14} className="text-[var(--signal-major)]" /> Operational Signals</h3>
            </header>
            <div className="p-4 space-y-3">
              {timelineStep >= 7 ? (
                <div className="bg-[var(--signal-major)]/10 border border-[var(--signal-major)]/20 p-3 rounded-md animate-in zoom-in-95 duration-500">
                  <div className="flex items-start justify-between mb-2">
                    <SignalBadge level="major">Major Signal</SignalBadge>
                    <span className="text-mono text-[10px] text-muted-foreground">14:12 IST</span>
                  </div>
                  <div className="text-[13px] font-medium leading-snug">EM plate excursion — Grade B corridor</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Cross-verified against SOP-ENV-044. Correlates with historical INV-1842.</div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-mono text-[var(--signal-major)]">SIG-8821</span>
                    <span className="text-foreground">Auto-creating investigation...</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-8">
                  <CheckCircle2 size={24} className="mb-2" />
                  <span className="text-xs">No active signals</span>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      <div className="flex justify-center py-2 text-muted-foreground/30">
        <ArrowRight className="rotate-90 h-6 w-6 text-[var(--signal-major)]/50" />
      </div>

      {/* --- PIPELINE STAGE 4: Investigation Engine (REAL DATA) --- */}
      <div className="px-6">
        <section className="panel border-border/80">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-surface-sunken/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary/10 text-primary grid place-items-center"><AlertCircle size={16} /></div>
              <div>
                <h2 className="text-[15px] font-medium tracking-tight">Investigation Engine</h2>
                <div className="text-[11px] text-muted-foreground mt-0.5">Live Data · Processing Operational Signals</div>
              </div>
            </div>
            <div className="text-mono text-[12px] bg-surface border border-border px-3 py-1 rounded">
              {queue.length} Active Cases
            </div>
          </header>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queue.map((q: any) => (
                <div key={q.realId} className="block group">
                  <div className="h-full rounded-lg border border-border bg-surface/40 hover:bg-surface hover:border-primary/40 transition p-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/60 to-transparent opacity-50" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/app/investigations/${q.realId}`} className="text-mono text-[11px] font-medium text-foreground hover:text-primary transition-colors">{q.id}</Link>
                        <SignalBadge level={q.level}>{q.status}</SignalBadge>
                      </div>
                      <span className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-surface-sunken">{q.owner}</span>
                    </div>
                    <Link to={`/app/investigations/${q.realId}`}>
                      <h3 className="text-[14px] font-medium leading-snug group-hover:text-primary transition-colors">{q.title}</h3>
                    </Link>
                    
                    <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest text-[9px] mb-0.5">Stage</div>
                        <div>{q.stage}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest text-[9px] mb-0.5">Evidence</div>
                        <div className="text-mono">{q.evidenceCount} Linked</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest text-[9px] mb-0.5">Traceability</div>
                        <button onClick={(e) => { e.preventDefault(); setGraphModal(q); }} className="text-primary hover:underline font-medium">Explore Graph →</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {queue.length === 0 && (
                <div className="col-span-2 py-10 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-surface-sunken/30">
                  <CheckCircle2 size={24} className="mb-2 text-[var(--signal-ok)]/50" />
                  <p className="text-sm">No active investigations.</p>
                  <p className="text-[11px] mt-1">All operational signals have been resolved.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-center py-2 text-muted-foreground/30">
        <ArrowRight className="rotate-90 h-6 w-6 text-primary/40" />
      </div>

      {/* --- PIPELINE STAGE 5 & 6: CAPA & Archival --- */}
      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="panel border-border/60 bg-surface-sunken/20">
            <header className="px-4 py-3 border-b border-border/60">
              <h3 className="text-[13px] font-medium tracking-tight flex items-center gap-2"><Target size={14} className="text-foreground" /> CAPA Execution</h3>
              <span className="text-[11px] text-muted-foreground">Derived from Active Investigations</span>
            </header>
            <div className="p-4">
              {activeCapas > 0 ? (
                <div className="flex items-center justify-between p-3 border border-border rounded bg-surface">
                  <div>
                    <div className="text-[13px] font-medium">CAPA-2026-081</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Linked to {queue[0]?.id || "INV-2041"}</div>
                  </div>
                  <SignalBadge level="minor">Pending Approval</SignalBadge>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground p-3 border border-border border-dashed rounded text-center">
                  Data Unavailable: No active CAPAs linked to your investigations.
                </div>
              )}
            </div>
          </section>

          <section className="panel border-[var(--signal-ok)]/20 bg-gradient-to-r from-surface-sunken to-[var(--signal-ok)]/5">
            <header className="px-4 py-3 border-b border-border/60">
              <h3 className="text-[13px] font-medium tracking-tight flex items-center gap-2"><History size={14} className="text-[var(--signal-ok)]" /> Historical Learning</h3>
              <span className="text-[11px] text-muted-foreground">Archival loop back to Enterprise Knowledge</span>
            </header>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-[var(--signal-ok)]/20 text-[var(--signal-ok)] grid place-items-center shrink-0 mt-0.5">
                  <Database size={12} />
                </div>
                <div>
                  <div className="text-[12px] font-medium leading-snug">Continuous Enrichment Active</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    When a CAPA is closed and verified, Helix automatically extracts the resolution matrix and updates the Enterprise Knowledge. 
                    <br/><br/>
                    <span className="text-foreground flex items-center gap-1"><ArrowRight size={12} /> Loop closed: Next operational event will reference these newly archived learnings.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Graph Modal */}
      {graphModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-border/60 w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-surface-sunken/50 z-10">
              <div>
                <h3 className="text-lg font-medium tracking-tight">Enterprise Traceability Graph</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Viewing nodes mapped to {graphModal.id} ({graphModal.title})</p>
              </div>
              <button 
                onClick={() => setGraphModal(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-background">
              {/* Background Grid */}
              <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
              
              {/* Connections (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}>
                <path d="M 200 150 C 350 150, 250 300, 400 300" fill="none" />
                <path d="M 200 450 C 350 450, 250 300, 400 300" fill="none" />
                <path d="M 400 300 C 550 300, 450 150, 600 150" fill="none" stroke="rgba(234, 179, 8, 0.4)" strokeDasharray="4 4" />
                <path d="M 400 300 C 550 300, 450 450, 600 450" fill="none" stroke="rgba(59, 130, 246, 0.4)" />
                <path d="M 600 150 C 750 150, 650 300, 800 300" fill="none" />
                <path d="M 600 450 C 750 450, 650 300, 800 300" fill="none" />
              </svg>
              
              {/* Nodes */}
              <div className="absolute top-[120px] left-[50px] p-4 bg-surface border border-border/80 rounded-lg shadow-lg z-10 w-[180px]">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Evidence</div>
                <div className="text-xs font-medium">Batch Record B24-1187</div>
              </div>

              <div className="absolute top-[420px] left-[50px] p-4 bg-surface border border-border/80 rounded-lg shadow-lg z-10 w-[180px]">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Evidence</div>
                <div className="text-xs font-medium">LIMS Report #9921</div>
              </div>

              <div className="absolute top-[260px] left-[310px] p-4 bg-[var(--signal-major)]/10 border border-[var(--signal-major)]/30 rounded-lg shadow-xl z-10 w-[200px] ring-1 ring-[var(--signal-major)]/50">
                <div className="text-[9px] uppercase tracking-widest text-[var(--signal-major)] mb-1">Investigation</div>
                <div className="text-sm font-medium">{graphModal.id}</div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">{graphModal.title}</div>
              </div>

              <div className="absolute top-[120px] left-[510px] p-4 bg-amber-400/10 border border-amber-400/30 rounded-lg shadow-lg z-10 w-[180px]">
                <div className="text-[9px] uppercase tracking-widest text-amber-400 mb-1">Knowledge Node</div>
                <div className="text-xs font-medium">SOP-ENV-044</div>
                <div className="text-[9px] text-muted-foreground mt-1">Rule Violation Detected</div>
              </div>

              <div className="absolute top-[420px] left-[510px] p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg shadow-lg z-10 w-[180px]">
                <div className="text-[9px] uppercase tracking-widest text-blue-400 mb-1">Knowledge Node</div>
                <div className="text-xs font-medium">Equipment: HVAC-02</div>
                <div className="text-[9px] text-muted-foreground mt-1">Cross-referenced OK</div>
              </div>

              <div className="absolute top-[260px] left-[710px] p-4 bg-surface border border-border/80 rounded-lg shadow-lg z-10 w-[180px]">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Proposed Action</div>
                <div className="text-xs font-medium">CAPA-2026-081</div>
                <div className="text-[9px] text-muted-foreground mt-1">Awaiting Approval</div>
              </div>
            </div>
            
            <div className="p-4 bg-surface-sunken/80 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between items-center z-10">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--signal-major)]"></div> Source Event</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Rule Violation</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Validated Asset</span>
              </div>
              <div>Graph recursively generated via Aetheris Organization Memory</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- Helper Components ---

function EventCard({ title, source, meta, icon, pulse }: { title: string, source: string, meta: string, icon: React.ReactNode, pulse?: boolean }) {
  return (
    <div className={`p-3 rounded-md border ${pulse ? 'border-blue-400/40 bg-blue-400/10' : 'border-border/60 bg-surface-sunken'} flex items-start gap-3 transition-colors`}>
      <div className={`mt-0.5 text-muted-foreground ${pulse ? 'animate-pulse text-blue-400' : ''}`}>
        {icon}
      </div>
      <div>
        <div className="text-[12.5px] font-medium leading-snug">{title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{source}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{meta}</div>
      </div>
    </div>
  );
}

function VerificationCheck({ label, status, detail }: { label: string, status: "pass"|"fail"|"warn", detail: string }) {
  const map = {
    pass: { icon: <CheckCircle2 size={12} />, color: "text-[var(--signal-ok)]", bg: "bg-[var(--signal-ok)]/10 border-[var(--signal-ok)]/20" },
    fail: { icon: <ShieldAlert size={12} />, color: "text-[var(--signal-major)]", bg: "bg-[var(--signal-major)]/10 border-[var(--signal-major)]/20" },
    warn: { icon: <AlertCircle size={12} />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" }
  };
  const m = map[status];
  
  return (
    <div className={`flex items-start justify-between p-2 border rounded ${m.bg}`}>
      <div className="flex items-center gap-2">
        <div className={m.color}>{m.icon}</div>
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <span className="text-[10.5px] text-muted-foreground">{detail}</span>
    </div>
  );
}
