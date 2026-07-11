import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvestigations } from "@/features/investigations/api/useInvestigations";
import { useCurrentUser } from "@/store/auth";
import { Zap, AlertCircle, Clock } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { InvestigationTable } from "@/features/investigations/components/InvestigationTable";

export const MyWorkPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const { data: res, isLoading } = useInvestigations();
  const investigations = res?.items || [];

  // Filter to investigations assigned to or created by current user
  const myInvestigations = investigations.filter(
    (inv: any) => inv.created_by === currentUser?.user_id || inv.assigned_to === currentUser?.user_id
  );

  // All open investigations if no personal filter matches (fallback for demo)
  const displayInvs = myInvestigations.length > 0 ? myInvestigations : investigations.filter((i: any) => i.status !== "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap size={20} className="text-blue-400" />
            My Work
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentUser?.full_name ?? currentUser?.email} · Investigations assigned to you
          </p>
        </div>
      </div>

      {/* Priority Queue */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-amber-400" />
          <h3 className="font-bold text-slate-100">Priority Queue</h3>
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ml-auto">
            {displayInvs.filter((i: any) => i.status === "pending_review").length} pending review
          </span>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8 text-slate-400">
            <Spinner size="lg" />
          </div>
        ) : (
          <InvestigationTable investigations={displayInvs.filter((i: any) => i.status === "pending_review")} />
        )}
        {!isLoading && displayInvs.filter((i: any) => i.status === "pending_review").length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Nothing pending review. Great work!</p>
        )}
      </div>

      {/* All Active */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-blue-400" />
          <h3 className="font-bold text-slate-100">Active Investigations</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8 text-slate-400">
            <Spinner size="lg" />
          </div>
        ) : (
          <InvestigationTable investigations={displayInvs.slice(0, 10)} />
        )}
      </div>
    </div>
  );
};
