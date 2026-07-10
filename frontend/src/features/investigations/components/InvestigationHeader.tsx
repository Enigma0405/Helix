import React from "react";
import { Badge } from "@/components/ui/Badge";
import { User, Calendar, Clock, AlertTriangle, ShieldAlert } from "lucide-react";

interface InvestigationHeaderProps {
  investigation: any;
  hypotheses: any[];
}

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({ investigation, hypotheses }) => {
  // Synthesize some metadata
  const bestConfidence = hypotheses.length > 0 
    ? Math.max(...hypotheses.map(h => h.confidence_score)) * 100 
    : 0;
    
  const isCritical = investigation.severity === "critical";

  // Synthesize "Why still open"
  let whyStillOpen = "Awaiting initial evidence review.";
  let momentumProgress = 20;
  let blocker = "Evidence Upload";
  
  if (investigation.status === "in_progress") {
    whyStillOpen = hypotheses.length > 0 ? "Reviewing AI generated root causes." : "Waiting for Timeline Agent to complete parsing.";
    momentumProgress = hypotheses.length > 0 ? 60 : 40;
    blocker = hypotheses.length > 0 ? "QA Review" : "Timeline Processing";
  } else if (investigation.status === "pending_review") {
    whyStillOpen = "Awaiting final sign-off from QA Reviewer.";
    momentumProgress = 90;
    blocker = "QA Approval";
  } else if (investigation.status === "closed") {
    whyStillOpen = "Investigation is successfully closed.";
    momentumProgress = 100;
    blocker = "None";
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-xl shrink-0">
      
      {/* Left side: Basic Info */}
      <div className="space-y-3 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase font-extrabold text-blue-400 tracking-widest bg-blue-500/10 px-2 py-1 rounded">
            INV-{investigation.id.split("-")[0].toUpperCase()}
          </span>
          <Badge variant={isCritical ? "red" : "amber"}>
            {investigation.severity.toUpperCase()} RISK
          </Badge>
          <Badge variant={investigation.status === "closed" ? "slate" : "blue"}>
            {investigation.status.replace("_", " ").toUpperCase()}
          </Badge>
          {bestConfidence > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <ShieldAlert size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                {bestConfidence.toFixed(0)}% CONFIDENCE
              </span>
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{investigation.title}</h2>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            Opened {new Date(investigation.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} />
            Time Open: {investigation.status === "closed" ? "Closed" : "14 hours"}
          </span>
          <span className="flex items-center gap-1">
            <User size={13} />
            Owner: {investigation.created_by.split("-")[0]}
          </span>
        </div>
      </div>

      {/* Center: Why still open */}
      <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-white/5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-amber-500" />
          Why is this investigation still open?
        </div>
        <p className="text-sm font-medium text-slate-200">
          {whyStillOpen}
        </p>
      </div>

      {/* Right: Momentum Widget */}
      <div className="flex-1 max-w-xs space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-xs font-bold text-slate-300">Investigation Progress</span>
          <span className="text-lg font-black text-blue-400">{momentumProgress}%</span>
        </div>
        
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-violet-500 transition-all duration-1000 ease-out"
            style={{ width: `${momentumProgress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1">
          <span className="flex items-center gap-1 truncate">
            <span className="text-slate-500 shrink-0">Waiting for:</span>
            <span className="text-slate-200 truncate">{blocker}</span>
          </span>
          <span className="text-slate-500 shrink-0">
            Est. {investigation.status === "closed" ? "Complete" : "5 min"}
          </span>
        </div>
      </div>

    </div>
  );
};
