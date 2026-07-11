import React from "react";
import { Info, AlertCircle, FileText, Sparkles, Target, Settings, ArrowRight, BrainCircuit, Activity } from "lucide-react";
import { SimulationPhase } from "../hooks/useInvestigationSimulation";

interface InvestigationNarrativeProps {
  investigation: any;
  hypotheses: any[];
  capa: any;
  evidenceItems: any[];
  simulation?: any;
  onOpenCapaEditor?: () => void;
}

export const InvestigationNarrative: React.FC<InvestigationNarrativeProps> = ({ 
  investigation, 
  hypotheses, 
  capa,
  evidenceItems,
  simulation,
  onOpenCapaEditor
}) => {
  const primaryHypothesis = hypotheses.length > 0 ? hypotheses[0] : null;
  const alternatives = hypotheses.slice(1);
  const phase: SimulationPhase = simulation?.phase || 'READY';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl h-full overflow-y-auto custom-scrollbar">
      <h3 className="font-bold text-lg text-slate-100 mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-md py-2 z-10 border-b border-white/5 flex justify-between items-center">
        <span>Investigation Narrative</span>
        {simulation && !simulation.isComplete && (
           <Activity size={14} className="text-violet-400 animate-pulse" />
        )}
      </h3>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        
        {/* Section 1: Current Situation / What Happened */}
        <div className="relative flex items-start gap-4">
          <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0 mt-1 relative z-10">
            <Info size={10} className="text-slate-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-slate-200">What Happened</h4>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {investigation.description || "Awaiting description parsing..."}
            </div>
          </div>
        </div>

        {/* Section 2: Evidence Summary */}
        <div className="relative flex items-start gap-4">
          <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-blue-600 flex items-center justify-center shrink-0 mt-1 relative z-10">
            <FileText size={10} className="text-blue-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-slate-200">Evidence Summary</h4>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
              {evidenceItems.length > 0 ? (
                <div className="space-y-2 text-sm text-slate-300">
                  <p>Initial evidence artifacts linked.</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    {evidenceItems.slice(0, 3).map((e, idx) => (
                      <li key={idx}>{e.original_filename}</li>
                    ))}
                    {evidenceItems.length > 3 && <li>...and {evidenceItems.length - 3} more.</li>}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No evidence collected yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Primary Hypothesis */}
        {primaryHypothesis && (
          <div className="relative flex items-start gap-4">
            <div className="h-5 w-5 rounded-full bg-violet-900 border-2 border-violet-500 flex items-center justify-center shrink-0 mt-1 relative z-10">
              <Sparkles size={10} className="text-violet-300" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                Primary Root Cause Hypothesis
              </h4>
              <div className="bg-violet-500/5 rounded-xl p-4 border border-violet-500/20 shadow-inner">
                <p className="text-sm font-semibold text-violet-200 mb-2">{primaryHypothesis.title}</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                  {primaryHypothesis.content}
                </p>

                {/* Progressive Enrichment block: Show AI updates based on phase */}
                {(phase === 'REASONING' || phase === 'DRAFTING' || phase === 'READY') && (
                  <div className="pt-4 border-t border-violet-500/10 mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] uppercase tracking-widest font-bold text-violet-400 flex items-center gap-1.5">
                         <BrainCircuit size={12} /> Graph Traversal Update
                       </span>
                       <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                         Confidence {simulation?.context?.confidence?.boost || "+8%"}
                       </span>
                     </div>
                     <p className="text-xs text-slate-300">
                       <span className="font-semibold text-white">Matched:</span> Historical Case <span className="text-blue-400">{simulation?.context?.historical_match?.investigation_id || "INV-0000"}</span>. 
                       Equipment <span className="text-blue-400">{simulation?.context?.equipment?.equipment_id || "Equipment"}</span> shows identical failure pattern in <span className="text-blue-400">{simulation?.context?.calibration?.calibration_id || "Calibration"}</span>. 
                       Deviation violates <span className="text-amber-400">{simulation?.context?.regulations?.[0] || "Regulation"}</span>. Enforcing <span className="text-emerald-400">{simulation?.context?.sop?.primary || "SOP"}</span>.
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Recommended CAPA (Only shown when drafting or ready) */}
        {capa && (phase === 'DRAFTING' || phase === 'READY') && (
          <div className="relative flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="h-5 w-5 rounded-full bg-emerald-900 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-1 relative z-10">
              <Target size={10} className="text-emerald-300" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-200">Recommended CAPA</h4>
              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20 shadow-inner text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {capa.content}
              </div>
              {onOpenCapaEditor && (
                <button
                  onClick={onOpenCapaEditor}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-400/40 transition-all"
                >
                  <ArrowRight size={12} />
                  Review &amp; Approve CAPA
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 4b: No CAPA yet - encourage generation */}
        {!capa && (phase === 'DRAFTING' || phase === 'READY') && onOpenCapaEditor && (
          <div className="relative flex items-start gap-4 animate-in fade-in duration-700">
            <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0 mt-1 relative z-10">
              <Target size={10} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <button
                onClick={onOpenCapaEditor}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 hover:border-violet-400/40 transition-all"
              >
                <ArrowRight size={12} />
                Draft CAPA Plan with AI
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
