import React, { useState } from "react";
import { useInvestigations } from "@/features/investigations/api/useInvestigations";
import { ShieldCheck, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";
import { CreateInvestigationModal } from "@/features/investigations/components/CreateInvestigationModal";
import { Button } from "@/components/ui/Button";
import { AIRuntimePanel } from "@/components/ui/AIRuntimePanel";
import { 
  MetricTile, 
  RuntimeAgentCard, 
  NextBestActionCard, 
  EvidenceCard 
} from "@/components/ui/Enterprise";

export const DashboardPage: React.FC = () => {
  const { data: investigationsRes, isLoading } = useInvestigations();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const investigations = investigationsRes?.items || [];
  
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Loading Command Center...</span>
      </div>
    );
  }

  // Active investigations for the table
  const activeInvestigations = investigations.filter(i => i.status !== "closed");
  const pendingReviewCount = investigations.filter(i => i.status === "pending_review").length;
  const closedCount = investigations.filter(i => i.status === "closed").length;
  
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">
      {/* 1. Header & Enterprise Health */}
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

      {/* 2. Enterprise Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile 
          label="Enterprise Health" 
          value="98.2%" 
          icon={ShieldCheck} 
          color="emerald" 
          trend="up" 
          delta="0.4%" 
        />
        <MetricTile 
          label="Open Investigations" 
          value={activeInvestigations.length} 
          icon={AlertCircle} 
          color="amber" 
          trend="up" 
          delta="2" 
        />
        <MetricTile 
          label="Pending Review" 
          value={pendingReviewCount} 
          icon={FileText} 
          color="violet" 
          trend="down" 
          delta="1" 
        />
        <MetricTile 
          label="Closed (30d)" 
          value={closedCount} 
          icon={CheckCircle2} 
          color="blue" 
          trend="up" 
          delta="5" 
        />
      </div>

      {/* 3. AI Workforce */}
      <div>
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">AI Workforce Activity</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <RuntimeAgentCard name="Evidence Ingestion" status="IDLE" />
          <RuntimeAgentCard name="Timeline Agent" status="PROCESSING" confidence={94} />
          <RuntimeAgentCard name="Knowledge Search" status="COMPLETE" confidence={88} />
          <RuntimeAgentCard name="Root Cause Agent" status="QUEUED" />
          <RuntimeAgentCard name="CAPA Drafter" status="WAITING" />
        </div>
      </div>

      {/* 4. Next Best Actions (The Action Layer) */}
      <div>
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">Priority Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NextBestActionCard 
            title="Review Sterility Failure CAPA (DEV-2026-001)" 
            missingEvidence="Line 3 Maintenance Log (Nov 2026)"
            expectedConfidence={96}
            estimatedTime="4 mins"
            actionLabel="Review CAPA"
          />
          <NextBestActionCard 
            title="Approve Particulate Excursion Findings" 
            expectedConfidence={92}
            estimatedTime="2 mins"
            actionLabel="Approve"
          />
        </div>
      </div>

      {/* 5. Main Content Layout: Investigations + Insights/Telemetry */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Investigations (takes up 2 columns) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100">Active Investigations</h3>
            </div>
            {/* If no data yet, it will safely render empty or the 8 items */}
            <InvestigationTable investigations={activeInvestigations.slice(0, 8)} />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100">Waiting On Me</h3>
            </div>
             <InvestigationTable investigations={activeInvestigations.filter(i => i.status === "pending_review").slice(0, 5)} />
          </div>
        </div>

        {/* Right Column: Discoveries & Telemetry */}
        <div className="space-y-6">
          
          {/* Recent Discoveries */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
             <h3 className="font-bold text-lg text-slate-100 mb-4">Recent Discoveries</h3>
             <div className="space-y-3">
               <EvidenceCard 
                  title="Filter Integrity Cert" 
                  type="DOCUMENT" 
                  source="LIMS" 
                  timestamp="2 mins ago" 
                  verified={true}
                  confidence={99}
                  summary="Post-use bubble point recorded at 3.1 bar (Fail)."
               />
               <EvidenceCard 
                  title="Line 3 Gowning Log" 
                  type="RECORD" 
                  source="MES" 
                  timestamp="14 mins ago"
                  verified={true}
               />
               <EvidenceCard 
                  title="Temperature Profile (B-104)" 
                  type="TELEMETRY" 
                  source="SCADA" 
                  timestamp="1 hour ago"
                  confidence={95}
                  summary="Excursion up to +8.5C detected."
               />
             </div>
          </div>

          {/* AI Runtime Telemetry */}
          <AIRuntimePanel />
        </div>

      </div>

      <CreateInvestigationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

