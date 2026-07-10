import React from "react";
import { Info, AlertCircle, FileText, Sparkles, Target, Settings, ArrowRight } from "lucide-react";

interface InvestigationNarrativeProps {
  investigation: any;
  hypotheses: any[];
  capa: any;
  evidenceItems: any[];
}

export const InvestigationNarrative: React.FC<InvestigationNarrativeProps> = ({ 
  investigation, 
  hypotheses, 
  capa,
  evidenceItems
}) => {
  const primaryHypothesis = hypotheses.length > 0 ? hypotheses[0] : null;
  const alternatives = hypotheses.slice(1);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl h-full overflow-y-auto">
      <h3 className="font-bold text-lg text-slate-100 mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-md py-2 z-10 border-b border-white/5">
        Investigation Narrative
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
                  <p>AI Agents have ingested and parsed {evidenceItems.length} evidence artifacts, including:</p>
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
                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                  {(primaryHypothesis.confidence_score * 100).toFixed(0)}% Confidence
                </span>
              </h4>
              <div className="bg-violet-500/5 rounded-xl p-4 border border-violet-500/20 shadow-inner">
                <p className="text-sm font-semibold text-violet-200 mb-2">{primaryHypothesis.title}</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {primaryHypothesis.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Alternative Hypotheses */}
        {alternatives.length > 0 && (
          <div className="relative flex items-start gap-4">
            <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0 mt-1 relative z-10">
              <AlertCircle size={10} className="text-slate-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-200">Alternative Hypotheses Explored</h4>
              <div className="space-y-3">
                {alternatives.map((alt, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-xs text-slate-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-300">{alt.title}</span>
                      <span>{(alt.confidence_score * 100).toFixed(0)}% Confidence</span>
                    </div>
                    <span className="line-clamp-2">{alt.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Recommended CAPA */}
        {capa && (
          <div className="relative flex items-start gap-4">
            <div className="h-5 w-5 rounded-full bg-emerald-900 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-1 relative z-10">
              <Target size={10} className="text-emerald-300" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-200">Recommended CAPA</h4>
              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20 shadow-inner text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {capa.content}
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Expected Outcome */}
        <div className="relative flex items-start gap-4">
          <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0 mt-1 relative z-10">
            <Settings size={10} className="text-slate-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-slate-200">Expected Outcome</h4>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 text-sm text-slate-400 flex items-center gap-3">
              <ArrowRight size={16} className="text-slate-500" />
              {capa 
                ? "Implementing these corrective actions will mitigate root cause recurrence and allow batch release." 
                : "Awaiting generation of corrective actions."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
