import React, { useState } from "react";
import { Citation } from "@/types";
import { Quote, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

interface CitationChipProps {
  citation: Citation;
}

export const CitationChip: React.FC<CitationChipProps> = ({ citation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all duration-200 ${
          citation.is_valid
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
        }`}
      >
        <FileText size={12} />
        <span className="max-w-[120px] truncate">{citation.source}</span>
        <span className="opacity-65">({Math.round(citation.score * 100)}%)</span>
        {citation.is_valid ? (
          <CheckCircle2 size={12} className="text-emerald-500" />
        ) : (
          <AlertTriangle size={12} className="text-amber-500" />
        )}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-850 border border-white/10 backdrop-blur-md rounded-lg shadow-xl z-55 text-xs text-slate-200">
          <div className="flex items-start gap-2 mb-1.5 font-semibold text-slate-300">
            <Quote size={12} className="mt-0.5 text-blue-400" />
            <span>Citation Quote Context:</span>
          </div>
          <p className="italic text-slate-400 leading-relaxed bg-white/5 p-2 rounded border border-white/5 max-h-32 overflow-y-auto">
            "{citation.text}"
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Score: {Math.round(citation.score * 100)}% Match</span>
            <span className={citation.is_valid ? "text-emerald-400" : "text-amber-400"}>
              {citation.is_valid ? "Grounded in Source" : "Possible Hallucination Warning"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
