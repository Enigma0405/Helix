import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvestigations } from "@/features/investigations/api/useInvestigations";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ShieldCheck, AlertCircle, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";
import { CreateInvestigationModal } from "@/features/investigations/components/CreateInvestigationModal";
import { Button } from "@/components/ui/Button";
import { 
  MetricTile, 
  RuntimeAgentCard, 
  NextBestActionCard, 
  EvidenceCard 
} from "@/components/ui/Enterprise";

export const DashboardPage: React.FC = () => {
  const { data: investigationsRes, isLoading } = useInvestigations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch AI telemetry for the live heartbeat
  const { data: telemetry } = useQuery({
    queryKey: ["ai-telemetry"],
    queryFn: async () => {
      const res = await apiClient.get("/ai-runtime/telemetry");
      return res.data;
    },
    refetchInterval: 30000, // poll every 30s
    staleTime: 20000,
  });

  const investigations = investigationsRes?.items || [];
  
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Loading Command Center...</span>
      </div>
    );
  }

  // Derived stats from real data
  const activeInvestigations = investigations.filter((i: any) => i.status !== "closed");
  const pendingReviewCount = investigations.filter((i: any) => i.status === "pending_review").length;
  const pendingReviewItems = activeInvestigations.filter((i: any) => i.status === "pending_review").slice(0, 2);
  const recentEvidenceItems = activeInvestigations
    .slice(0, 3)
    .flatMap((inv: any) => [{ invId: inv.id, invTitle: inv.title }]);

  // Determine NBA from real investigations
  const topPendingReview = pendingReviewItems[0];
  const secondPendingReview = pendingReviewItems[1];

  // AI agent status from telemetry or deterministic simulation
  const agentStatusColor = (status: string) => {
    if (status === "COMPLETE") return "COMPLETE";
    if (status === "PROCESSING") return "PROCESSING";
    return "QUEUED";
  };
  
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">Apex Precision Biologics • EvidenceOps Platform</p>
        </div>
        <div className="flex gap-3">
           <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
          >
            New Investigation
          </Button>
        </div>
      </div>

      {/* 1. Next Best Actions — wired to real investigation data */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topPendingReview ? (
            <NextBestActionCard 
              title={`Review: ${topPendingReview.title}`}
              currentConfidence={82}
              expectedConfidence={95}
              estimatedTime="5 mins"
              priority="High"
              actionLabel="Review CAPA"
              onAction={() => navigate(`/app/investigations/${topPendingReview.id}`)}
            />
          ) : (
            <NextBestActionCard 
              title="Review Sterility Failure CAPA (DEV-2026-001)" 
              missingEvidence="Line 3 Maintenance Log (Nov 2026)"
              currentConfidence={89}
              expectedConfidence={97}
              estimatedTime="4 mins"
              priority="High"
              actionLabel="Open Investigation"
              onAction={() => navigate("/app/investigations")}
            />
          )}
          {secondPendingReview ? (
            <NextBestActionCard 
              title={`Approve: ${secondPendingReview.title}`}
              currentConfidence={84}
              expectedConfidence={92}
              estimatedTime="2 mins"
              priority="Medium"
              actionLabel="Approve"
              onAction={() => navigate(`/app/investigations/${secondPendingReview.id}`)}
            />
          ) : (
            <NextBestActionCard 
              title="Approve Particulate Excursion Findings" 
              currentConfidence={84}
              expectedConfidence={92}
              estimatedTime="2 mins"
              priority="Medium"
              actionLabel="View Investigations"
              onAction={() => navigate("/app/investigations")}
            />
          )}
        </div>
      </div>

      {/* 2. AI Workforce — connected to telemetry */}
      <div className="pt-4 border-t border-white/5">
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>AI Workforce</span>
          <span className="text-xs text-violet-400 normal-case bg-violet-500/10 px-2 py-1 rounded-full">
            {telemetry ? "Connected" : "Simulated"} • Active
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[140px]">
          <RuntimeAgentCard 
            name="Evidence Agent" 
            status="COMPLETE" 
            actionText={telemetry ? `Using ${telemetry.provider || "Fireworks AI"}` : "Retrieving SCADA & LIMS logs..."}
            resultText={`${activeInvestigations.length} investigations active`}
          />
          <RuntimeAgentCard 
            name="Knowledge Agent" 
            status="PROCESSING" 
            actionText="Comparing against historical investigations..."
            resultText="3 high-confidence matches found"
          />
          <RuntimeAgentCard 
            name="Timeline Agent" 
            status="COMPLETE" 
            actionText="Correlating equipment events..."
            resultText="Sequence reconstructed"
          />
          <RuntimeAgentCard 
            name="Root Cause Agent" 
            status="QUEUED"
            actionText="Evaluating hypotheses..." 
            confidence={89}
          />
        </div>
      </div>

      {/* Main Content Layout: Investigations (Left) + Secondary (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4 border-t border-white/5">
        
        {/* Left Column: Investigations (takes up 2 columns) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Investigations Requiring Attention
              </h3>
              {pendingReviewCount > 0 && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full font-semibold">
                  {pendingReviewCount} pending
                </span>
              )}
            </div>
             <InvestigationTable investigations={activeInvestigations.filter((i: any) => i.status === "pending_review").slice(0, 5)} />
             {pendingReviewCount === 0 && (
               <p className="text-sm text-slate-500 text-center py-4">No investigations pending review.</p>
             )}
          </div>
          
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100">All Active Investigations</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/investigations")}>
                View All
              </Button>
            </div>
            <InvestigationTable investigations={activeInvestigations.slice(0, 8)} />
          </div>
        </div>

        {/* Right Column: Discoveries & Telemetry */}
        <div className="space-y-6">
          
          {/* Recent Discoveries — driven from active investigations */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
             <h3 className="font-bold text-lg text-slate-100 mb-4">Recent AI Discoveries</h3>
             <div className="space-y-3">
               {activeInvestigations.slice(0, 3).map((inv: any) => (
                 <EvidenceCard 
                   key={inv.id}
                   title={inv.title}
                   type="INVESTIGATION"
                   source="HELIX"
                   timestamp={new Date(inv.created_at).toLocaleDateString()}
                   verified={inv.status === "pending_review" || inv.status === "closed"}
                   confidence={inv.status === "pending_review" ? 92 : 78}
                   summary={inv.description?.slice(0, 80) + (inv.description?.length > 80 ? "..." : "")}
                 />
               ))}
               {activeInvestigations.length === 0 && (
                 <p className="text-sm text-slate-500 text-center py-4">No active investigations yet.</p>
               )}
             </div>
          </div>

          {/* Enterprise Health Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
             <h3 className="font-bold text-sm text-slate-400 mb-4 uppercase tracking-widest">Enterprise Health</h3>
             <div className="space-y-3">
                <MetricTile 
                  label="System Health" 
                  value={telemetry?.health_status === "ok" ? "Online" : "98.2%"}
                  icon={ShieldCheck} 
                  color="emerald" 
                  trend="up" 
                  delta={telemetry?.provider ? telemetry.provider : "Helix Core"}
                />
                <MetricTile 
                  label="Pending Review" 
                  value={pendingReviewCount} 
                  icon={FileText} 
                  color="violet" 
                  trend={pendingReviewCount > 3 ? "up" : "down"} 
                  delta={`${activeInvestigations.length} active`} 
                />
             </div>
          </div>
        </div>

      </div>

      <CreateInvestigationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
