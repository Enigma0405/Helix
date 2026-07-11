import React from "react";
import { Cpu, CheckCircle2, Circle, ArrowRight, Sparkles, Activity, FileText, BrainCircuit, Loader2, Database, Network } from "lucide-react";
import { SimulationPhase } from "../hooks/useInvestigationSimulation";

interface InvestigationRuntimeProps {
  investigation: any;
  evidenceItems: any[];
  hypotheses: any[];
  simulation?: any;
}

export const InvestigationRuntime: React.FC<InvestigationRuntimeProps> = ({ 
  investigation, 
  evidenceItems,
  hypotheses,
  simulation
}) => {
  const phase: SimulationPhase = simulation?.phase || 'READY';
  
  // Safely extract context variables, providing generic fallbacks if context is still loading
  const ctx = simulation?.context || {};
  const equipmentId = ctx.equipment?.equipment_id || "Equipment";
  const calibrationId = ctx.calibration?.calibration_id || "Calibration Log";
  const historicalCaseId = ctx.historical_match?.investigation_id || "Historical Case";
  const primarySop = ctx.sop?.primary || "Applicable SOP";
  const primaryRegulation = ctx.regulations?.[0] || "Applicable Regulation";
  const confidenceScore = ctx.confidence?.score || 91;
  const confidenceBoost = ctx.confidence?.boost || "+8%";

  // Define agent blocks as Graph Traversals
  const blocks = [
    {
      id: "evidence",
      name: "Evidence & Context",
      icon: <Database size={14} className="text-blue-400" />,
      isActive: phase === 'INITIALIZING',
      isDone: phase !== 'INITIALIZING',
      actionText: "Loading equipment context...",
      resultText: `Linked Equipment ${equipmentId}`,
      reason: null,
      confidenceBoost: null
    },
    {
      id: "timeline",
      name: "Calibration & Timeline",
      icon: <Activity size={14} className="text-amber-400" />,
      isActive: phase === 'SEARCHING',
      isDone: phase === 'REASONING' || phase === 'DRAFTING' || phase === 'READY',
      actionText: "Pulling calibration logs...",
      resultText: `Checked ${calibrationId}`,
      reason: "Calibration log confirms recent drift out of specification for probe T-402.",
      confidenceBoost: null
    },
    {
      id: "knowledge",
      name: "Regulatory Graph",
      icon: <Network size={14} className="text-violet-400" />,
      isActive: phase === 'REASONING',
      isDone: phase === 'DRAFTING' || phase === 'READY',
      actionText: "Traversing Knowledge Graph...",
      resultText: `Matched ${primarySop} & ${primaryRegulation}`,
      reason: `Deviation triggers mandatory assessment per ${primaryRegulation} (Equipment).`,
      confidenceBoost: "+4%"
    },
    {
      id: "rootcause",
      name: "Historical Intelligence",
      icon: <Sparkles size={14} className="text-emerald-400" />,
      isActive: phase === 'DRAFTING',
      isDone: phase === 'READY',
      actionText: "Searching historical cases...",
      resultText: `Found Match: ${historicalCaseId}`,
      reason: "Historical case exhibits identical temperature excursion due to probe failure.",
      confidenceBoost: confidenceBoost
    }
  ];

  return (
    <div className="bg-slate-900/80 border border-violet-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden h-full flex flex-col">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
        <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
          <Cpu size={18} className="text-violet-400" />
          Enterprise Knowledge Graph
        </h3>
        {phase === 'READY' ? (
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            READY FOR REVIEW
          </span>
        ) : (
          <span className="text-[10px] font-bold tracking-widest text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20 shadow-ai animate-pulse">
            TRAVERSING
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

                {block.isDone && block.reason && (
                  <div className="space-y-1 mt-2 bg-black/20 p-2 rounded border border-white/5">
                    <p className="text-xs text-slate-300 font-medium">{block.reason}</p>
                  </div>
                )}

                {block.isDone && block.confidenceBoost && (
                  <div className="space-y-1 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">
                      <Sparkles size={10} />
                      Confidence {block.confidenceBoost}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Knowledge Sources Verification */}
        {phase !== 'INITIALIZING' && (
          <div className="pt-4 border-t border-white/5 mt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Knowledge Sources Consulted</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <CheckCircle2 size={12} className="text-emerald-500" /> Equipment Registry
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${phase === 'SEARCHING' ? 'text-slate-500' : 'text-slate-300'}`}>
                {phase === 'SEARCHING' ? <Circle size={12} className="text-slate-600" /> : <CheckCircle2 size={12} className="text-emerald-500" />} 
                Calibration Records
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${phase === 'SEARCHING' || phase === 'REASONING' ? 'text-slate-500' : 'text-slate-300'}`}>
                {phase === 'SEARCHING' || phase === 'REASONING' ? <Circle size={12} className="text-slate-600" /> : <CheckCircle2 size={12} className="text-emerald-500" />} 
                Regulatory Guidance
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${phase === 'SEARCHING' || phase === 'REASONING' ? 'text-slate-500' : 'text-slate-300'}`}>
                {phase === 'SEARCHING' || phase === 'REASONING' ? <Circle size={12} className="text-slate-600" /> : <CheckCircle2 size={12} className="text-emerald-500" />} 
                SOP Library
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${phase !== 'READY' ? 'text-slate-500' : 'text-slate-300'}`}>
                {phase !== 'READY' ? <Circle size={12} className="text-slate-600" /> : <CheckCircle2 size={12} className="text-emerald-500" />} 
                Historical Investigations
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
