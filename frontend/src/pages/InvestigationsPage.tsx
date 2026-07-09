import React, { useState } from "react";
import { useInvestigations, useCreateInvestigation } from "@/features/investigations/api/useInvestigations";
import type { InvestigationStatus, InvestigationSeverity } from "@/types";
import { FolderKanban, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";
import { CreateInvestigationModal } from "@/features/investigations/components/CreateInvestigationModal";
import { Button } from "@/components/ui/Button";

export const InvestigationsPage: React.FC = () => {
  const [status, setStatus] = useState<"" | InvestigationStatus>("");
  const [severity, setSeverity] = useState<"" | InvestigationSeverity>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: res, isLoading } = useInvestigations({
    status: status || undefined,
    severity: severity || undefined,
  });

  const investigations = res?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban size={20} className="text-blue-400" />
            RCA Investigation Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active batches, document analysis, and preventive logs
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          <Plus size={14} />
          <span>New Case</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | InvestigationStatus)}
            className="bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as "" | InvestigationSeverity)}
            className="bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        {isLoading ? (
          <div className="flex justify-center p-12 text-slate-400">
            <Spinner size="lg" />
            <span className="ml-3 text-sm">Querying workspace...</span>
          </div>
        ) : (
          <InvestigationTable investigations={investigations} />
        )}
      </div>

      <CreateInvestigationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
