import React, { useState } from "react";
import { Network, ChevronDown, ChevronRight, FileText, User, Archive, Box, BookOpen, Clock, Target } from "lucide-react";

interface GraphNodeProps {
  label: string;
  icon: any;
  color: string;
  children?: React.ReactNode;
}

const GraphNode: React.FC<GraphNodeProps> = ({ label, icon: Icon, color, children }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = !!children;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 group">
        {hasChildren ? (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="h-5 w-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-400"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-slate-900/50 hover:bg-white/5 transition-colors cursor-default`}>
          <Icon size={14} className={color} />
          <span className="text-xs font-semibold text-slate-200">{label}</span>
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div className="ml-5 pl-4 border-l border-white/10 mt-2 space-y-2 relative">
          {children}
        </div>
      )}
    </div>
  );
};

interface EvidenceGraphMVPProps {
  investigation?: any;
  evidenceItems?: any[];
}

export const EvidenceGraphMVP: React.FC<EvidenceGraphMVPProps> = ({ investigation, evidenceItems = [] }) => {
  const invTitle = investigation?.title || "Investigation Root";
  const equipmentId = investigation?.equipment_id || null;

  return (
    <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-5 overflow-x-auto shadow-inner">
      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-4">
        <Network size={16} className="text-slate-400" />
        Evidence Graph
      </h3>
      
      <div className="min-w-max p-2">
        <GraphNode label={invTitle} icon={Target} color="text-violet-400">
          {equipmentId && (
            <GraphNode label={`Equipment: ${equipmentId}`} icon={Box} color="text-amber-400" />
          )}
          {investigation?.batch_id && (
            <GraphNode label={`Batch: ${investigation.batch_id}`} icon={Archive} color="text-emerald-400" />
          )}
          {investigation?.created_by && (
            <GraphNode label={`Investigator: ${investigation.created_by.split('-')[0]}`} icon={User} color="text-blue-400" />
          )}
          {evidenceItems.length > 0 && (
            <GraphNode label="Evidence" icon={FileText} color="text-rose-400">
              {evidenceItems.map((e: any) => (
                <GraphNode 
                  key={e.id} 
                  label={e.original_filename} 
                  icon={FileText} 
                  color="text-slate-400" 
                />
              ))}
            </GraphNode>
          )}
          {evidenceItems.length === 0 && (
            <GraphNode label="No evidence uploaded yet" icon={FileText} color="text-slate-600" />
          )}
          <GraphNode label="SOP Library — Linked" icon={BookOpen} color="text-indigo-400" />
          <GraphNode label="Historical Case Search" icon={Clock} color="text-slate-400" />
          <GraphNode label="CAPA Draft" icon={Target} color="text-emerald-400" />
        </GraphNode>
      </div>
    </div>
  );
};
