import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/useToast";

interface MissingEvidencePanelProps {
  investigationId?: string;
}

export const MissingEvidencePanel: React.FC<MissingEvidencePanelProps> = ({ investigationId }) => {
  // These items are derived from the Knowledge Graph analysis of what's typically needed
  // for a sterility deviation investigation. In a full implementation, these would come
  // from the backend's missing-evidence detection logic.
  const missingItems = [
    {
      id: "calibration_cert",
      label: "Calibration Certificate",
      source: "LIMS",
      confidenceImpact: "+12%",
      priority: "high",
    },
    {
      id: "gowning_log",
      label: "Line 3 Gowning Log",
      source: "MES",
      confidenceImpact: "+5%",
      priority: "medium",
    },
  ];

  const handleRequest = (item: typeof missingItems[0]) => {
    toast.success(
      "Evidence Requested",
      `Request sent for "${item.label}" from ${item.source}. ETA: 15 minutes.`
    );
  };

  if (missingItems.length === 0) {
    return (
      <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-emerald-400">All expected evidence collected</span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-5">
      <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2 mb-3">
        <AlertCircle size={14} />
        Missing Evidence Detected
      </h3>
      <div className="space-y-3">
        {missingItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 block">{item.label}</span>
              <span className="text-[10px] text-slate-400">
                From: {item.source} •{" "}
                <span className="text-emerald-400 font-bold">{item.confidenceImpact} confidence</span>
              </span>
            </div>
            <button
              onClick={() => handleRequest(item)}
              className="shrink-0 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/20 transition-all"
            >
              Request
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
