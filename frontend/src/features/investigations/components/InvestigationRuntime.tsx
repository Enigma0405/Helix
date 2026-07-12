import React from "react";
import { Cpu, CheckCircle2, Circle, ArrowRight, Sparkles, Activity, FileText, BrainCircuit, Loader2, Database, Network, AlertTriangle } from "lucide-react";
import { SimulationPhase } from "../hooks/useInvestigationSimulation";

interface InvestigationRuntimeProps {
  investigation: any;
  evidenceItems: any[];
  assessment?: any;
  simulation?: any;
}

export const InvestigationRuntime: React.FC<InvestigationRuntimeProps> = ({ 
  investigation, 
  evidenceItems,
  assessment,
  simulation
}) => {
  const phase: SimulationPhase = simulation?.phase || 'IDLE';
  const confidenceScore = assessment?.confidence?.score || 0;
  
  // Define agent blocks as live progress Traversals
  const blocks = [
    {
      id: "uploading",
      name: "Evidence Ingestion",
      icon: <Database size={14} className="text-blue-400" />,
      isActive: phase === 'UPLOADING',
      isDone: phase === 'PARSING' || phase === 'RETRIEVING' || phase === 'RANKING' || phase === 'REASONING' || phase === 'READY',
      actionText: "Uploading Evidence...",
      resultText: "Evidence Uploaded",
      reason: null
    },
    {
      id: "parsing",
      name: "Document Processing",
      icon: <FileText size={14} className="text-amber-400" />,
      isActive: phase === 'PARSING',
      isDone: phase === 'RETRIEVING' || phase === 'RANKING' || phase === 'REASONING' || phase === 'READY',
      actionText: "Parsing Documents...",
      resultText: "Documents Parsed",
      reason: null
    },
    {
      id: "retrieving",
      name: "Organization Memory",
      icon: <Network size={14} className="text-violet-400" />,
      isActive: phase === 'RETRIEVING',
      isDone: phase === 'RANKING' || phase === 'REASONING' || phase === 'READY',
      actionText: "Retrieving Organization Knowledge...",
      resultText: "Knowledge Retrieved",
      reason: null
    },
    {
      id: "ranking",
      name: "Evidence Ranking",
      icon: <Activity size={14} className="text-emerald-400" />,
      isActive: phase === 'RANKING',
      isDone: phase === 'REASONING' || phase === 'READY',
      actionText: "Ranking Evidence...",
      resultText: "Evidence Ranked",
      reason: null
    },
    {
      id: "reasoning",
      name: "Intelligence Reasoning",
      icon: <Sparkles size={14} className="text-pink-400" />,
      isActive: phase === 'REASONING',
      isDone: phase === 'READY',
      actionText: "Running Reasoning...",
      resultText: "Assessment Generated",
      reason: null
    }
  ];

  return (
    <div className="bg-slate-900/80 border border-violet-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden h-full flex flex-col">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
        <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
          <Cpu size={18} className="text-violet-400" />
          Intelligence Layer
        </h3>
        {phase === 'READY' && assessment ? (
          <div className="flex items-center gap-3">
            {simulation?.processingTime > 0 && (
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Processing Time {simulation.processingTime.toFixed(1)}s
              </span>
            )}
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 size={12} /> CONFIDENCE: {confidenceScore}%
            </span>
          </div>
        ) : phase !== 'IDLE' ? (
          <span className="text-[10px] font-bold tracking-widest text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20 shadow-ai animate-pulse">
            TRAVERSING
          </span>
        ) : (
          <span className="text-[10px] font-bold tracking-widest text-slate-400 bg-slate-500/10 px-2 py-1 rounded border border-slate-500/20">
            IDLE
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 relative z-10 pr-2 custom-scrollbar">
        {blocks.map((block, idx) => {
          if (!block.isActive && !block.isDone && phase !== 'READY') return null;

          return (
            <div key={block.id} className={`space-y-3 pb-6 ${idx < blocks.length - 1 ? 'border-b border-white/5' : ''}`}>
              <div className="flex items-center gap-2">
                {block.icon}
                <span className="text-sm font-bold text-slate-200">{block.name}</span>
              </div>
              
              <div className="pl-6 space-y-3">
                {block.isActive ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={14} className="animate-spin text-violet-400" />
                    {block.actionText}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <CheckCircle2 size={14} />
                    {block.resultText}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Render Real Assessment Details when Ready */}
        {phase === 'READY' && assessment && (
          <div className="pt-4 border-t border-white/5 mt-4 space-y-4 animate-in fade-in duration-500">
            {/* Missing Evidence */}
            {assessment.missing_evidence && assessment.missing_evidence.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} /> Missing Evidence Flagged
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {assessment.missing_evidence.map((me: any, i: number) => (
                    <li key={i} className="text-xs text-amber-200/80">{me.description} (Priority: {me.priority})</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Contradictions */}
            {assessment.contradictions && assessment.contradictions.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} /> Contradictions Detected
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {assessment.contradictions.map((c: any, i: number) => (
                    <li key={i} className="text-xs text-rose-200/80">{c.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations used */}
            {assessment.evidence && assessment.evidence.length > 0 && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Citations Used</h4>
                <div className="space-y-2">
                  {assessment.evidence.slice(0, 3).map((ev: any, i: number) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-blue-400 mt-0.5 shrink-0" />
                      <span className="truncate">{ev.source}</span>
                    </div>
                  ))}
                  {assessment.evidence.length > 3 && (
                    <div className="text-xs text-slate-500 pl-5">
                      + {assessment.evidence.length - 3} more citations
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
