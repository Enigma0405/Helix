import React, { useState } from "react";
import { useInvestigations, useCreateInvestigation } from "@/features/investigations/api/useInvestigations";
import { AlertCircle, Cpu, Sparkles, FolderOpen, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";
import { CreateInvestigationModal } from "@/features/investigations/components/CreateInvestigationModal";
import { Button } from "@/components/ui/Button";

export const DashboardPage: React.FC = () => {
  const { data: investigationsRes, isLoading } = useInvestigations();
  const createMutation = useCreateInvestigation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const investigations = investigationsRes?.items || [];

  const counts = {
    open: investigations.filter((i) => i.status === "open").length,
    in_progress: investigations.filter((i) => i.status === "in_progress").length,
    pending_review: investigations.filter((i) => i.status === "pending_review").length,
    closed: investigations.filter((i) => i.status === "closed").length,
  };

  const handleCreate = (data: { title: string; description: string; severity: "critical" | "high" | "medium" | "low" }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Loading Helix Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/20 via-violet-950/20 to-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Welcome to Project Helix
            <Sparkles size={18} className="text-violet-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            A production-quality EvidenceOps platform running on an AMD-optimized AI runtime.
            Upload sterility documents, generate grounded root causes, and capture CAPA records.
          </p>
        </div>

        {/* AMD Specs indicator */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl shrink-0">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Cpu size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">AI Inference Status</span>
            <span className="text-xs font-semibold text-slate-200">Gemma 3 27B on AMD MI300X</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Open incidents</span>
              <span className="text-2xl font-bold text-blue-400 mt-1 block">{counts.open}</span>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <FolderOpen size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">In progress</span>
              <span className="text-2xl font-bold text-violet-400 mt-1 block">{counts.in_progress}</span>
            </div>
            <div className="h-10 w-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
              <Clock size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Under Review</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{counts.pending_review}</span>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <ClipboardList size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Closed cases</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">{counts.closed}</span>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main investigations list */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-100">Quality Investigations</h3>
            <p className="text-xs text-slate-400">Active sterility and process deviation reviews</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            New Investigation
          </Button>
        </div>

        {investigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <AlertCircle size={32} className="mb-2" />
            <span className="text-sm">No investigations found. Create one to begin.</span>
          </div>
        ) : (
          <InvestigationTable investigations={investigations.slice(0, 5)} />
        )}
      </div>

      <CreateInvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};
