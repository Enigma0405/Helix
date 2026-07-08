import React from "react";
import { useAuthStore } from "@/store/auth";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Settings, User, Cpu, ShieldAlert, Award } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings size={20} className="text-blue-400" />
          System Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure platform options, authentication details, and model endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User profile card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 pb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <User size={16} className="text-blue-400" />
                User Profile
              </h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Full Name</span>
                  <span className="font-semibold text-slate-200">{currentUser?.full_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-200">{currentUser?.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Workspace Role</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 capitalize">
                    {currentUser?.role || "analyst"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Organisation ID</span>
                  <span className="font-mono text-xs text-slate-400 block truncate max-w-[200px] mt-1">
                    {currentUser?.org_id || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI configurations */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 pb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-violet-400" />
                AI Inference Configuration
              </h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="font-semibold text-slate-200 block">Inference Provider</span>
                    <span className="text-xs text-slate-400">Model execution engine selected for RCA generation</span>
                  </div>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-200 uppercase">
                    Gemma 3 / Fireworks AI
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="font-semibold text-slate-200 block">Hardware Compute Adapter</span>
                    <span className="text-xs text-slate-400">Accelerator backing the inference calls</span>
                  </div>
                  <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-xs font-bold uppercase">
                    AMD MI300X Accelerator
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-200 block">Local Embedding Model</span>
                    <span className="text-xs text-slate-400">Local text splitter and vectorizer</span>
                  </div>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-200">
                    all-MiniLM-L6-v2 (384-dims)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Access Info */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/5 pb-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-400" />
                Compliance & Security
              </h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs leading-relaxed text-slate-400">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Award className="text-emerald-500 shrink-0" size={16} />
                  <span>
                    <strong>Audit Logging Active:</strong> All changes to investigations, uploads, or approvals are fully tracked.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Award className="text-emerald-500 shrink-0" size={16} />
                  <span>
                    <strong>Role-Based Access:</strong> Reviewers and Admins are permitted to approve CAPA plans.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
