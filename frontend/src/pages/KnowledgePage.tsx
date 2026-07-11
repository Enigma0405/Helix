import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Layers, BookOpen, FlaskConical, Settings, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export const KnowledgePage: React.FC = () => {
  // Fetch the knowledge documents from the backend
  const { data: docsRes, isLoading } = useQuery({
    queryKey: ["knowledge-documents"],
    queryFn: async () => {
      const res = await apiClient.get("/documents");
      return res.data;
    },
    staleTime: 60000,
  });

  const docs = docsRes?.items || [];

  // Knowledge packs are the organized knowledge domains available in Helix
  const knowledgePacks = [
    {
      id: "equipment",
      title: "Equipment Registry",
      description: "Equipment metadata, calibration history, maintenance logs",
      icon: Settings,
      color: "text-amber-400",
      count: "Active",
      source: "Organization Memory",
    },
    {
      id: "sops",
      title: "SOP Library",
      description: "Standard Operating Procedures for all manufacturing lines",
      icon: BookOpen,
      color: "text-indigo-400",
      count: "Active",
      source: "Organization Memory",
    },
    {
      id: "historical",
      title: "Historical Investigations",
      description: "Past investigation cases available for AI pattern matching",
      icon: FlaskConical,
      color: "text-emerald-400",
      count: "Active",
      source: "Organization Memory",
    },
    {
      id: "regulations",
      title: "Regulatory Guidance",
      description: "FDA 21 CFR, EU GMP Annex 1, ICH Q10 compliance references",
      icon: Layers,
      color: "text-violet-400",
      count: "Active",
      source: "Organization Memory",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers size={20} className="text-blue-400" />
          Knowledge Base
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Organization Memory · AI-accessible knowledge packs powering investigation intelligence
        </p>
      </div>

      {/* Knowledge Packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledgePacks.map((pack) => {
          const Icon = pack.icon;
          return (
            <div
              key={pack.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={18} className={pack.color} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{pack.title}</h3>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      {pack.count} · {pack.source}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">{pack.description}</p>
            </div>
          );
        })}
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-blue-400" />
          Uploaded Documents
          {docs.length > 0 && (
            <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full ml-auto">
              {docs.length} documents
            </span>
          )}
        </h3>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p>No documents uploaded yet.</p>
            <p className="text-xs mt-1">Upload PDFs and SOPs from the Evidence section in any investigation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.slice(0, 10).map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{doc.title || doc.filename}</span>
                  <span className="text-[10px] text-slate-500">{doc.doc_type} · {new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                  {doc.chunk_count ?? 0} chunks
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
