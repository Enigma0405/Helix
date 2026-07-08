import React, { useState } from "react";
import { Hypothesis } from "@/types";
import { CitationChip } from "./CitationChip";
import { Check, X, Edit3, ShieldAlert, Award } from "lucide-react";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  onReview: (status: "accepted" | "rejected" | "modified", content?: string) => void;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({ hypothesis, onReview }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(hypothesis.content);

  const handleSave = () => {
    onReview("modified", editedContent);
    setIsEditing(false);
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.7) return "bg-emerald-500";
    if (score >= 0.4) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className={`p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      hypothesis.status === "accepted"
        ? "bg-emerald-500/5 border-emerald-500/20"
        : hypothesis.status === "rejected"
        ? "bg-rose-500/5 border-rose-500/20 opacity-60"
        : "bg-white/5 border-white/10"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-lg text-slate-100">{hypothesis.title}</h4>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Confidence:</span>
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${confidenceColor(hypothesis.confidence_score || 0)}`}
                  style={{ width: `${(hypothesis.confidence_score || 0.5) * 100}%` }}
                />
              </div>
              <span className="font-medium text-slate-300">
                {Math.round((hypothesis.confidence_score || 0.5) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Grounding Score:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                (hypothesis.grounding_score || 0) >= 0.8
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
                {(hypothesis.grounding_score || 0) >= 0.8 ? <Award size={12} /> : <ShieldAlert size={12} />}
                {Math.round((hypothesis.grounding_score || 0) * 100)}%
              </span>
            </div>

            <div className="capitalize">
              Status: <span className={
                hypothesis.status === "accepted"
                  ? "text-emerald-400 font-semibold"
                  : hypothesis.status === "rejected"
                  ? "text-rose-400"
                  : "text-blue-400"
              }>{hypothesis.status}</span>
            </div>
          </div>
        </div>

        {hypothesis.status === "pending" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onReview("accepted")}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all duration-200"
              title="Accept Hypothesis"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onReview("rejected")}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all duration-200"
              title="Reject Hypothesis"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-all duration-200"
              title="Modify Details"
            >
              <Edit3 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] p-3 text-sm bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditedContent(hypothesis.content);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">{hypothesis.content}</p>
        )}
      </div>

      {hypothesis.evidence_citations && hypothesis.evidence_citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-xs font-medium text-slate-400 mb-2">Grounding Evidence Citations:</div>
          <div className="flex flex-wrap gap-2">
            {hypothesis.evidence_citations.map((citation, index) => (
              <CitationChip key={index} citation={citation} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
