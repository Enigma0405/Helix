import React from "react";
import { useInvestigations } from "@/features/investigations/api/useInvestigations";
import { FlaskConical, TrendingUp, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export const AnalyticsPage: React.FC = () => {
  const { data: res, isLoading } = useInvestigations();
  const investigations = res?.items || [];

  const total = investigations.length;
  const closed = investigations.filter((i: any) => i.status === "closed").length;
  const open = investigations.filter((i: any) => i.status === "open").length;
  const inProgress = investigations.filter((i: any) => i.status === "in_progress").length;
  const pendingReview = investigations.filter((i: any) => i.status === "pending_review").length;

  const critical = investigations.filter((i: any) => i.severity === "critical").length;
  const high = investigations.filter((i: any) => i.severity === "high").length;
  const medium = investigations.filter((i: any) => i.severity === "medium").length;
  const low = investigations.filter((i: any) => i.severity === "low").length;

  const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  const severityData = [
    { label: "Critical", count: critical, color: "bg-red-500", textColor: "text-red-400" },
    { label: "High", count: high, color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Medium", count: medium, color: "bg-blue-500", textColor: "text-blue-400" },
    { label: "Low", count: low, color: "bg-slate-500", textColor: "text-slate-400" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FlaskConical size={20} className="text-blue-400" />
          Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Investigation outcomes, severity distribution, platform KPIs</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Investigations", value: total, icon: FlaskConical, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Closed", value: closed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Pending Review", value: pendingReview, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Closure Rate", value: `${closureRate}%`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className={`rounded-2xl border p-5 ${tile.bg} flex items-center gap-4`}>
              <Icon size={24} className={tile.color} />
              <div>
                <p className="text-2xl font-black text-slate-100">{tile.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{tile.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400" /> Severity Distribution
          </h3>
          <div className="space-y-3">
            {severityData.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${s.textColor}`}>{s.label}</span>
                  <span className="text-slate-400">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-700`}
                    style={{ width: total > 0 ? `${(s.count / total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" /> Status Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: "Open", count: open, color: "bg-blue-500" },
              { label: "In Progress", count: inProgress, color: "bg-violet-500" },
              { label: "Pending Review", count: pendingReview, color: "bg-amber-500" },
              { label: "Closed", count: closed, color: "bg-emerald-500" },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{s.label}</span>
                  <span className="text-slate-400">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-700`}
                    style={{ width: total > 0 ? `${(s.count / total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent closed investigations */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" /> Closed Investigations
        </h3>
        {investigations.filter((i: any) => i.status === "closed").length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No closed investigations yet.</p>
        ) : (
          <div className="space-y-2">
            {investigations
              .filter((i: any) => i.status === "closed")
              .slice(0, 5)
              .map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{inv.title}</span>
                    <span className="text-[10px] text-slate-500">
                      Closed · {new Date(inv.updated_at || inv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                    {inv.severity}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
