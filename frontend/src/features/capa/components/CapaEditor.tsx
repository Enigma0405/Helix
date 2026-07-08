import React, { useState } from "react";
import { CAPA, User } from "@/types";
import { Sparkles, FileText, CheckCircle2, Save, X, Edit, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface CapaEditorProps {
  capa?: CAPA;
  isLoading: boolean;
  currentUser: User | null;
  hasAcceptedHypotheses: boolean;
  onGenerate: (orgContext: string) => void;
  onUpdate: (content: string) => void;
  onApprove: () => void;
  isMutating: boolean;
}

export const CapaEditor: React.FC<CapaEditorProps> = ({
  capa,
  isLoading,
  currentUser,
  hasAcceptedHypotheses,
  onGenerate,
  onUpdate,
  onApprove,
  isMutating,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [orgContext, setOrgContext] = useState("");

  const handleStartEdit = () => {
    if (capa) {
      setEditedContent(capa.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(editedContent);
    setIsEditing(false);
  };

  const canApprove = currentUser?.role === "admin" || currentUser?.role === "reviewer";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Spinner size="lg" />
        <span className="mt-3 text-sm">Loading CAPA records...</span>
      </div>
    );
  }

  // 1. Case: No CAPA drafted yet
  if (!capa) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl text-center">
        <FileText size={48} className="text-slate-500 mb-4" />
        <h4 className="font-semibold text-lg text-slate-200">No CAPA Plan Drafted</h4>
        <p className="text-sm text-slate-400 max-w-md mt-1.5 mb-6">
          Corrective and Preventive Action (CAPA) plans are generated using AI based on approved hypotheses.
        </p>

        {!hasAcceptedHypotheses ? (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs max-w-md">
            <ShieldAlert size={16} className="shrink-0" />
            <span>You must accept at least one AI hypothesis before drafting the CAPA plan.</span>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            <div>
              <label className="block text-left text-xs font-semibold text-slate-400 mb-1.5">
                Organisation-specific CAPA Guidelines (Optional):
              </label>
              <textarea
                value={orgContext}
                onChange={(e) => setOrgContext(e.target.value)}
                placeholder="E.g., Include specific Millipore filter testing references or EU GMP Annex 1 guidelines..."
                className="w-full min-h-[80px] p-3 text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                disabled={isMutating}
              />
            </div>
            <button
              onClick={() => onGenerate(orgContext)}
              disabled={isMutating}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-emerald-950/20"
            >
              {isMutating ? (
                <>
                  <Spinner size="sm" />
                  <span>Drafting CAPA...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Draft CAPA Plan (Gemma 3)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Case: CAPA drafted (and potentially approved)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">CAPA Workflow Status</span>
          <span className={`inline-flex items-center gap-1.5 mt-1 text-sm font-semibold ${
            capa.status === "approved"
              ? "text-emerald-400"
              : capa.status === "review"
              ? "text-amber-400"
              : "text-blue-400"
          }`}>
            <CheckCircle2 size={16} />
            <span className="capitalize">{capa.status}</span>
          </span>
        </div>

        {capa.status === "draft" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartEdit}
              disabled={isMutating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium border border-white/10 transition-all"
            >
              <Edit size={14} />
              <span>Modify Draft</span>
            </button>

            {canApprove && (
              <button
                onClick={onApprove}
                disabled={isMutating}
                className="flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-md shadow-emerald-950/20"
              >
                {isMutating ? <Spinner size="sm" /> : <CheckCircle2 size={14} />}
                <span>Approve Action Plan</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm min-h-[300px]">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[350px] p-4 font-mono text-sm bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isMutating}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed">
            {capa.content}
          </div>
        )}
      </div>

      {capa.status === "approved" && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-400">
          <p>
            <strong>Closed-loop Learning Triggered:</strong> Approval of this CAPA has successfully locked this investigation, changed status to CLOSED, and auto-archived the root causes into the org-wide vector knowledge base.
          </p>
        </div>
      )}
    </div>
  );
};
