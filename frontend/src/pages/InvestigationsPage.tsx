import React, { useState } from "react";
import { useInvestigations, useCreateInvestigation } from "@/features/investigations/api/useInvestigations";
import { FolderKanban, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";
import { CreateInvestigationModal } from "@/features/investigations/components/CreateInvestigationModal";
import { StatusFilter } from "@/features/investigations/components/StatusFilter";
import { Button } from "@/components/ui/Button";

export const InvestigationsPage: React.FC = () => {
  const [status, setStatus] = useState<any>("");
  const [severity, setSeverity] = useState<any>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: res, isLoading } = useInvestigations({ status, severity });

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
        <StatusFilter
          value={status}
          onChange={setStatus}
          options={[
            { label: "All Statuses", value: "" },
            { label: "Open", value: "open" },
            { label: "In Progress", value: "in_progress" },
            { label: "Pending Review", value: "pending_review" },
            { label: "Closed", value: "closed" },
          ]}
          label="Status"
        />

        <StatusFilter
          value={severity}
          onChange={setSeverity}
          options={[
            { label: "All Severities", value: "" },
            { label: "Critical", value: "critical" },
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ]}
          label="Severity"
        />
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
