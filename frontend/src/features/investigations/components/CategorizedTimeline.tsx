import React from "react";
import { Server, User, Sparkles, FileText, CheckCircle } from "lucide-react";

interface CategorizedTimelineProps {
  events: any[];
}

export const CategorizedTimeline: React.FC<CategorizedTimelineProps> = ({ events }) => {
  // Categorize events based on action string
  const categorizedEvents = events.map((event) => {
    let category = "SYSTEM";
    let icon = Server;
    let color = "text-slate-400";
    let border = "border-slate-500/20";
    let bg = "bg-slate-500/10";
    
    if (event.action.includes("evidence")) {
      category = "EVIDENCE";
      icon = FileText;
      color = "text-blue-400";
      border = "border-blue-500/20";
      bg = "bg-blue-500/10";
    } else if (event.action.includes("hypotheses") || event.action.includes("ai")) {
      category = "AI";
      icon = Sparkles;
      color = "text-violet-400";
      border = "border-violet-500/20";
      bg = "bg-violet-500/10";
    } else if (event.action.includes("approve")) {
      category = "APPROVAL";
      icon = CheckCircle;
      color = "text-emerald-400";
      border = "border-emerald-500/20";
      bg = "bg-emerald-500/10";
    } else if (event.action === "created") {
      category = "HUMAN";
      icon = User;
      color = "text-amber-400";
      border = "border-amber-500/20";
      bg = "bg-amber-500/10";
    }

    return { ...event, category, icon, color, border, bg };
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md overflow-x-auto">
      <h3 className="font-bold text-lg text-slate-100 mb-6 sticky left-0">
        Investigation Timeline
      </h3>
      
      <div className="flex gap-4 pb-2 min-w-max">
        {categorizedEvents.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={idx} className="flex flex-col w-56 shrink-0">
              {/* Category Header */}
              <div className={`flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${event.bg} ${event.color} w-fit`}>
                <Icon size={12} />
                {event.category}
              </div>
              
              {/* Time and line */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <div className="flex-1 h-px bg-white/10" />
              </div>
              
              {/* Content */}
              <div className={`p-3 rounded-xl border ${event.border} ${event.bg} space-y-1 h-full`}>
                <p className="text-xs font-bold text-slate-200">
                  {event.action.replace(/_/g, " ").toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-400">
                  By: {event.actor_id.split("-")[0]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
