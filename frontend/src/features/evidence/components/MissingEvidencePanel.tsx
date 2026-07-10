import React from "react";
import { AlertCircle, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const MissingEvidencePanel: React.FC = () => {
  return (
    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-rose-200 flex items-center gap-1.5 uppercase tracking-widest">
          <AlertCircle size={14} className="text-rose-400" />
          Missing Evidence
        </h3>
        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold tracking-widest uppercase">
          HIGH PRIORITY
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-lg font-black text-slate-100">Calibration Certificate</p>
          <p className="text-xs text-rose-300 mt-1">Required to verify valve calibration before final approval.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
              Expected Confidence
            </span>
            <div className="flex items-center gap-2 text-sm font-black">
              <span className="text-slate-400">82%</span>
              <ArrowRight size={12} className="text-slate-600" />
              <span className="text-emerald-400">94%</span>
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
              Estimated Time
            </span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-300">
              <Clock size={14} className="text-slate-400" />
              4 min
            </div>
          </div>
        </div>

        <Button className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-xl text-xs transition-colors">
          Request Evidence
        </Button>
      </div>
    </div>
  );
};
