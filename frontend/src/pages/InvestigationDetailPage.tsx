import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import {
  useInvestigations,
  useUpdateInvestigation,
} from "@/features/investigations/api/useInvestigations";
import { useEvidence, useUploadEvidence } from "@/features/evidence/api/useEvidence";
import {
  useHypotheses,
  useGenerateHypotheses,
  useUpdateHypothesis,
} from "@/features/hypotheses/api/useHypotheses";
import {
  useCapa,
  useGenerateCapa,
  useUpdateCapa,
  useApproveCapa,
  useExportInvestigation,
} from "@/features/capa/api/useCapa";

import { useToast } from "@/hooks/useToast";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { EvidenceUploadZone } from "@/features/evidence/components/EvidenceUploadZone";
import { HypothesisCard } from "@/features/hypotheses/components/HypothesisCard";
import { GenerateHypothesesButton } from "@/features/hypotheses/components/GenerateHypothesesButton";
import { CapaEditor } from "@/features/capa/components/CapaEditor";
import { AIRuntimePanel } from "@/components/ui/AIRuntimePanel";

import {
  FileText,
  Sparkles,
  ClipboardCheck,
  History,
  Info,
  Calendar,
  User,
  ArrowRight,
  TrendingRight,
  Download,
} from "lucide-react";

type TabType = "overview" | "evidence" | "hypotheses" | "capa" | "audit";

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Fetch Investigation details
  const { data: investigation, isLoading: isInvLoading } = useQuery({
    queryKey: ["investigations", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/investigations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch audit timeline
  const { data: timelineRes, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["timeline", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/investigations/${id}/timeline`);
      return res.data;
    },
    enabled: !!id && activeTab === "audit",
  });

  const updateInvMutation = useUpdateInvestigation();
  const { data: evidenceItems = [], isLoading: isEvidenceLoading } = useEvidence(id || "");
  const uploadEvidenceMutation = useUploadEvidence();

  const { data: hypotheses = [], isLoading: isHypothesesLoading } = useHypotheses(id || "");
  const generateHypothesesMutation = useGenerateHypotheses();
  const updateHypothesisMutation = useUpdateHypothesis(id || "");

  const { data: capa, isLoading: isCapaLoading } = useCapa(id || "");
  const generateCapaMutation = useGenerateCapa();
  const updateCapaMutation = useUpdateCapa(id || "");
  const approveCapaMutation = useApproveCapa(id || "");
  const exportMutation = useExportInvestigation();

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    updateInvMutation.mutate(
      { id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["investigations", id] });
          toast({ title: "Status Updated", description: `Investigation is now ${newStatus}.` });
        },
      }
    );
  };

  const handleEvidenceUpload = (files: File[]) => {
    if (!id) return;
    files.forEach((file) => {
      uploadEvidenceMutation.mutate(
        { file, investigationId: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["evidence", id] });
            toast({ title: "Upload Success", description: `${file.name} uploaded as evidence.` });
          },
        }
      );
    });
  };

  const handleGenerateHypotheses = (num: number) => {
    if (!id) return;
    generateHypothesesMutation.mutate(
      { investigationId: id, num_hypotheses: num },
      {
        onSuccess: () => {
          toast({ title: "Analysis Complete", description: "AI Hypotheses generated successfully." });
        },
      }
    );
  };

  const handleHypothesisReview = (
    hypothesisId: string,
    status: "accepted" | "rejected" | "modified",
    content?: string
  ) => {
    updateHypothesisMutation.mutate(
      { hypothesisId, data: { status, content } },
      {
        onSuccess: () => {
          toast({ title: "Review Submitted", description: `Hypothesis marked as ${status}.` });
        },
      }
    );
  };

  const handleGenerateCapa = (orgContext: string) => {
    if (!id) return;
    generateCapaMutation.mutate(
      { investigationId: id, org_context: orgContext },
      {
        onSuccess: () => {
          toast({ title: "Action Plan Created", description: "CAPA draft generated using AI." });
        },
        onError: (err) => {
          toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleCapaUpdate = (content: string) => {
    if (!capa?.id) return;
    updateCapaMutation.mutate(
      { capaId: capa.id, content },
      {
        onSuccess: () => {
          toast({ title: "Draft Saved", description: "CAPA draft content has been modified." });
        },
      }
    );
  };

  const handleCapaApprove = () => {
    if (!capa?.id) return;
    approveCapaMutation.mutate(
      { capaId: capa.id },
      {
        onSuccess: () => {
          toast({ title: "CAPA Approved", description: "Investigation closed & captured to Knowledge Base." });
          queryClient.invalidateQueries({ queryKey: ["investigations", id] });
        },
      }
    );
  };

  const handleExportPDF = () => {
    if (!id) return;
    exportMutation.mutate(
      { investigationId: id },
      {
        onSuccess: (data) => {
          if (data.download_url) {
            window.open(data.download_url, "_blank");
          } else {
            // Retrieve URL manually using GET /api/exports/{id}
            apiClient.get(`/api/exports/${data.id}`).then((res) => {
              if (res.data.download_url) window.open(res.data.download_url, "_blank");
            });
          }
          toast({ title: "Export Initiated", description: "PDF generated. Check your downloads." });
        },
      }
    );
  };

  if (isInvLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Querying investigation record...</span>
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

  const hasAcceptedHypotheses = hypotheses.some((h) => h.status === "accepted");

  return (
    <div className="space-y-6">
      {/* Detail Header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Case ID: {investigation.id.slice(0, 8)}
              </span>
              <Badge variant={investigation.severity === "critical" ? "destructive" : "secondary"}>
                {investigation.severity}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{investigation.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Created: {new Date(investigation.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                Analyst ID: {investigation.created_by.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Status switcher */}
            <select
              value={investigation.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="closed">Closed</option>
            </select>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exportMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-white/10 rounded-lg font-semibold transition-all"
            >
              {exportMutation.isPending ? <Spinner size="sm" /> : <Download size={14} />}
              <span>Report PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center border-b border-white/10 gap-2 overflow-x-auto pb-px">
        {(
          [
            { id: "overview", label: "Overview", icon: Info },
            { id: "evidence", label: "Evidence Files", icon: FileText },
            { id: "hypotheses", label: "AI Hypotheses", icon: Sparkles },
            { id: "capa", label: "CAPA Action Plan", icon: ClipboardCheck },
            { id: "audit", label: "Audit Log", icon: History },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === t.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Incident description */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Incident Description
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {investigation.description || "No description provided."}
                </p>
              </div>

              {/* Tasks Checklist */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  RCA Tasks & Corrective Actions
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Define tasks to ensure all compliance checks are completed.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full shrink-0" />
                    <span>Filter integrity test scheduled.</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0" />
                    <span>Filling line environment logs review.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar quick info */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Case Details
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Severity</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {investigation.severity}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Status</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {investigation.status}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Total Evidence Files</span>
                    <span className="font-semibold text-slate-200">
                      {evidenceItems.length} Files
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved Causes</span>
                    <span className="font-semibold text-emerald-400">
                      {hypotheses.filter((h) => h.status === "accepted").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-6">
            {/* Upload Zone */}
            <EvidenceUploadZone
              onUpload={handleEvidenceUpload}
              isUploading={uploadEvidenceMutation.isPending}
            />

            {/* Evidence Inventory */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-slate-100 mb-4">Uploaded Evidence</h3>

              {isEvidenceLoading ? (
                <Spinner size="md" />
              ) : evidenceItems.length === 0 ? (
                <p className="text-xs text-slate-500">No evidence uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidenceItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-sm text-slate-200 block truncate max-w-[200px]">
                          {item.original_filename}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{item.mime_type}</span>
                          <span>•</span>
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </div>

                      {item.status === "processed" && (
                        <Link
                          to={`/investigations/${id}/evidence/${item.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                        >
                          <span>Review Chunks</span>
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "hypotheses" && (
          <div className="space-y-6">
            {/* AI Action Form */}
            <GenerateHypothesesButton
              onGenerate={handleGenerateHypotheses}
              isLoading={generateHypothesesMutation.isPending}
              disabled={evidenceItems.length === 0}
            />

            {/* Generated list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-100">Root-Cause Hypotheses</h3>
                <span className="text-xs text-slate-400">
                  {hypotheses.length} Hypotheses Generated
                </span>
              </div>

              {isHypothesesLoading ? (
                <Spinner size="md" />
              ) : hypotheses.length === 0 ? (
                <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl text-slate-500 text-sm">
                  Click 'Generate Hypotheses' above to run AI RCA models.
                </div>
              ) : (
                <div className="space-y-4">
                  {hypotheses.map((hyp) => (
                    <HypothesisCard
                      key={hyp.id}
                      hypothesis={hyp}
                      onReview={(status, content) =>
                        handleHypothesisReview(hyp.id, status, content)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "capa" && (
          <CapaEditor
            capa={capa}
            isLoading={isCapaLoading}
            currentUser={currentUser}
            hasAcceptedHypotheses={hasAcceptedHypotheses}
            onGenerate={handleGenerateCapa}
            onUpdate={handleCapaUpdate}
            onApprove={handleCapaApprove}
            isMutating={generateCapaMutation.isPending || approveCapaMutation.isPending}
          />
        )}

        {activeTab === "audit" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg text-slate-100 mb-6 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Investigation Audit Log & Timeline
            </h3>

            {isTimelineLoading ? (
              <Spinner size="md" />
            ) : !timelineRes || timelineRes.events.length === 0 ? (
              <p className="text-xs text-slate-500">No logs recorded yet.</p>
            ) : (
              <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
                {timelineRes.events.map((event: any, index: number) => (
                  <div key={index} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      <p className="text-sm font-semibold text-slate-200">
                        {event.action.toUpperCase()} Action on {event.entity_type}
                      </p>
                      <p className="text-xs text-slate-400">
                        By User: {event.actor_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Diagnostic Telemetry Panel */}
      <div className="mt-8">
        <AIRuntimePanel />
      </div>
    </div>
  );
};
