import React from "react";
import { X, FileText, Activity, Layers, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EvidenceDrawerProps {
  citation: any;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ citation, onClose }) => {
  return (
    <AnimatePresence>
      {citation && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-[500px] bg-slate-900 border-l border-white/10 shadow-2xl z-[100] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/50">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              Evidence Source
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Document</h4>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="font-semibold text-slate-200">{citation.source || "Unknown Document"}</span>
                <p className="text-xs text-slate-400 mt-1">ID: {citation.document_id}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Retrieved Chunk</h4>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 shadow-inner">
                <p className="text-sm text-slate-300 leading-relaxed font-mono">
                  "{citation.text || citation.excerpt || "Text content not available in citation."}"
                </p>
              </div>
            </div>

            {citation.relevance_score && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity size={14} className="text-emerald-400" />
                  Retrieval Score
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.min(100, (citation.relevance_score * 100))}%` }} 
                    />
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {(citation.relevance_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            
            {/* Metadata Tags */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag size={14} />
                Metadata Context
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold bg-white/5 border border-white/10 text-slate-300 px-2 py-1 rounded">
                  TENANT: AETHERIS_BIOPHARMA
                </span>
                <span className="text-[10px] uppercase font-bold bg-white/5 border border-white/10 text-slate-300 px-2 py-1 rounded">
                  CHUNK_ID: {citation.chunk_id || "N/A"}
                </span>
                <span className="text-[10px] uppercase font-bold bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-1 rounded flex items-center gap-1">
                  <Layers size={10} /> VECTOR_EMBEDDING
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
