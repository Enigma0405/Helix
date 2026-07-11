import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useEvidenceList } from "@/features/evidence/api/useEvidence";
import { useHypotheses } from "@/features/hypotheses/api/useHypotheses";
import { useCapa, useGenerateCapa, useUpdateCapa, useApproveCapa } from "@/features/capa/api/useCapa";
import { useInvestigationSimulation } from "@/features/investigations/hooks/useInvestigationSimulation";
import { useCurrentUser } from "@/store/auth";
import { toast } from "@/hooks/useToast";

import { Spinner } from "@/components/ui/Spinner";
import { Info, FileText, ArrowRight, Target } from "lucide-react";
import { EvidenceUploadZone } from "@/features/evidence/components/EvidenceUploadZone";

// Workspace Components
import { InvestigationHeader } from "@/features/investigations/components/InvestigationHeader";
import { InvestigationNarrative } from "@/features/investigations/components/InvestigationNarrative";
import { InvestigationRuntime } from "@/features/investigations/components/InvestigationRuntime";
import { CategorizedTimeline } from "@/features/investigations/components/CategorizedTimeline";
import { MissingEvidencePanel } from "@/features/evidence/components/MissingEvidencePanel";
import { EvidenceGraphMVP } from "@/features/evidence/components/EvidenceGraphMVP";
import { CapaEditor } from "@/features/capa/components/CapaEditor";

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useCurrentUser();
  const [showCapaEditor, setShowCapaEditor] = useState(false);

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

  const generateCapa = useGenerateCapa();
  const updateCapa = useUpdateCapa(id || "");
  const approveCapa = useApproveCapa(id || "");

  const simulation = useInvestigationSimulation(id || '', null, 2000);

  const hasAcceptedHypotheses = hypotheses.some((h: any) => h.status === "accepted");
  const isMutating = generateCapa.isPending || updateCapa.isPending || approveCapa.isPending;

  const handleGenerateCapa = async (orgContext: string) => {
    try {
      await generateCapa.mutateAsync({ investigationId: id || '', org_context: orgContext });
      toast.success("CAPA Drafted", "AI has generated a Corrective Action Plan.");
    } catch {
      toast.error("Error", "Failed to generate CAPA.");
    }
  };

  const handleUpdateCapa = async (content: string) => {
    if (!capa?.id) return;
    try {
      await updateCapa.mutateAsync({ capaId: capa.id, content });
      toast.success("Saved", "CAPA plan updated.");
    } catch {
      toast.error("Error", "Failed to update CAPA.");
    }
  };

  const handleApproveCapa = async () => {
    if (!capa?.id) return;
    try {
      await approveCapa.mutateAsync({ capaId: capa.id });
      toast.success("Approved!", "Investigation closed. Knowledge captured to Organization Memory.");
    } catch {
      toast.error("Error", "Failed to approve CAPA.");
    }
  };

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
        <Link to="/app" className="inline-block mt-4 text-xs font-semibold text-blue-400">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Top: Header */}
      <InvestigationHeader investigation={investigation} hypotheses={hypotheses} simulation={simulation} />

      {/* Middle: 3-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[800px]">
        
        {/* LEFT COLUMN: Evidence & Context */}
        <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          <EvidenceGraphMVP investigation={investigation} evidenceItems={evidenceItems} />
          <MissingEvidencePanel investigationId={id || ""} />
          
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
                    <Link to={`/app/investigations/${id}/evidence/${item.id}`} className="shrink-0 text-blue-400 hover:text-blue-300">
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
            simulation={simulation}
            onOpenCapaEditor={() => setShowCapaEditor(!showCapaEditor)}
          />
        </div>

        {/* RIGHT COLUMN: AI Runtime */}
        <div className="h-full">
          <InvestigationRuntime 
            investigation={investigation}
            evidenceItems={evidenceItems}
            hypotheses={hypotheses}
            simulation={simulation}
          />
        </div>

      </div>

      {/* CAPA Editor Panel — rendered when showCapaEditor is true */}
      {showCapaEditor && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Target size={18} className="text-emerald-400" />
            <h3 className="font-bold text-lg text-slate-100">CAPA Action Plan</h3>
            <span className="text-xs text-slate-500 ml-auto">Corrective & Preventive Action</span>
          </div>
          <CapaEditor
            capa={capa}
            isLoading={isCapaLoading}
            currentUser={currentUser}
            hasAcceptedHypotheses={hasAcceptedHypotheses}
            onGenerate={handleGenerateCapa}
            onUpdate={handleUpdateCapa}
            onApprove={handleApproveCapa}
            isMutating={isMutating}
          />
        </div>
      )}

      {/* BOTTOM: Timeline */}
      <div className="pt-6 border-t border-white/10">
        <CategorizedTimeline events={timelineRes?.events || []} />
      </div>

    </div>
  );
};
