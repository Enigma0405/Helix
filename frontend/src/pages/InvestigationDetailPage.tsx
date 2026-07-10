import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useEvidenceList } from "@/features/evidence/api/useEvidence";
import { useHypotheses } from "@/features/hypotheses/api/useHypotheses";
import { useCapa } from "@/features/capa/api/useCapa";

import { Spinner } from "@/components/ui/Spinner";
import { Info, FileText, ArrowRight } from "lucide-react";
import { EvidenceUploadZone } from "@/features/evidence/components/EvidenceUploadZone";

// Workspace Components
import { InvestigationHeader } from "@/features/investigations/components/InvestigationHeader";
import { InvestigationNarrative } from "@/features/investigations/components/InvestigationNarrative";
import { InvestigationRuntime } from "@/features/investigations/components/InvestigationRuntime";
import { CategorizedTimeline } from "@/features/investigations/components/CategorizedTimeline";
import { MissingEvidencePanel } from "@/features/evidence/components/MissingEvidencePanel";
import { EvidenceGraphMVP } from "@/features/evidence/components/EvidenceGraphMVP";

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch investigation details
  const { data: investigation, isLoading: isInvLoading } = useQuery({
    queryKey: ["investigations", id],
    queryFn: async () => {
      const res = await apiClient.get(`/investigations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: timelineRes, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["timeline", id],
    queryFn: async () => {
      const res = await apiClient.get(`/investigations/${id}/timeline`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: evidenceItems = [], isLoading: isEvidenceLoading } = useEvidenceList(id || "");
  const { data: hypotheses = [], isLoading: isHypothesesLoading } = useHypotheses(id || "");
  const { data: capa, isLoading: isCapaLoading } = useCapa(id || "");

  if (isInvLoading || isTimelineLoading || isEvidenceLoading || isHypothesesLoading || isCapaLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Initializing Investigation Workspace...</span>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="text-center p-12 text-slate-400 border border-dashed border-white/10 rounded-2xl">
        <Info size={32} className="mx-auto mb-2 text-rose-500" />
        <h3 className="font-semibold text-lg">Investigation Not Found</h3>
        <p className="text-sm mt-1">Check the URL link or select a different case.</p>
        <Link to="/" className="inline-block mt-4 text-xs font-semibold text-blue-400">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Top: Header */}
      <InvestigationHeader investigation={investigation} hypotheses={hypotheses} />

      {/* Middle: 3-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[800px]">
        
        {/* LEFT COLUMN: Evidence & Context */}
        <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          <EvidenceGraphMVP />
          <MissingEvidencePanel />
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-4">
              <FileText size={16} className="text-slate-400" />
              Evidence Collection
            </h3>
            <EvidenceUploadZone investigationId={id || ""} />
            
            <div className="mt-4 space-y-2">
              {evidenceItems.map((item: any) => (
                <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-semibold text-xs text-slate-200 block truncate">
                      {item.original_filename}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.status}</span>
                  </div>
                  {item.status === "processed" && (
                    <Link to={`/investigations/${id}/evidence/${item.id}`} className="shrink-0 text-blue-400 hover:text-blue-300">
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Narrative */}
        <div className="h-full">
          <InvestigationNarrative 
            investigation={investigation} 
            hypotheses={hypotheses} 
            capa={capa} 
            evidenceItems={evidenceItems} 
          />
        </div>

        {/* RIGHT COLUMN: AI Runtime */}
        <div className="h-full">
          <InvestigationRuntime 
            investigation={investigation}
            evidenceItems={evidenceItems}
            hypotheses={hypotheses}
          />
        </div>

      </div>

      {/* BOTTOM: Timeline */}
      <div className="pt-6 border-t border-white/10">
        <CategorizedTimeline events={timelineRes?.events || []} />
      </div>

    </div>
  );
};
