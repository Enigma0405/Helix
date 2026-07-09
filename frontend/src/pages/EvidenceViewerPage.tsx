import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ArrowLeft, FileText, LayoutGrid, Quote, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Chunk {
  id: string;
  source_id: string;
  source_type: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, any>;
}

export const EvidenceViewerPage: React.FC = () => {
  const { id, evidenceId } = useParams<{ id: string; evidenceId: string }>();
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);

  // Fetch Evidence details
  const { data: evidence, isLoading: isEvidenceLoading } = useQuery({
    queryKey: ["evidence", "item", evidenceId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/evidence/${evidenceId}`);
      return res.data;
    },
    enabled: !!evidenceId,
  });

  // Fetch chunks for this evidence item
  const { data: chunksData, isLoading: isChunksLoading } = useQuery<Chunk[]>({
    queryKey: ["evidence", "chunks", evidenceId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/evidence/${evidenceId}/chunks`);
      return res.data;
    },
    enabled: !!evidenceId,
  });

  const chunks: Chunk[] = chunksData || [];

  // Fallback to select first chunk when loaded if not already selected
  React.useEffect(() => {
    if (chunks.length > 0 && !selectedChunk) {
      setSelectedChunk(chunks[0]);
    }
  }, [chunks, selectedChunk]);

  if (isEvidenceLoading || isChunksLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">
        <Spinner size="lg" />
        <span className="ml-3 text-sm font-medium">Extracting document chunks...</span>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl max-w-sm">
          <FileText size={40} className="mx-auto text-rose-500 mb-3" />
          <h3 className="font-semibold text-lg text-slate-200">Evidence Record Not Found</h3>
          <Link to={`/investigations/${id}`} className="mt-4 inline-block text-xs font-semibold text-blue-400">
            Back to Investigation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-slate-200 overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center gap-4 px-6 py-4 bg-slate-900/80 border-b border-white/10 backdrop-blur-md shrink-0">
        <Link
          to={`/investigations/${id}`}
          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Evidence Processor</span>
          <h1 className="text-lg font-bold text-slate-100">{evidence.original_filename}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1 rounded-lg text-xs text-slate-400">
          <LayoutGrid size={14} className="text-blue-400" />
          <span>{chunks.length} Semantic Chunks</span>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side: Chunks list */}
        <section className="w-80 border-r border-white/10 bg-slate-900/40 flex flex-col min-h-0">
          <div className="p-4 border-b border-white/5 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Semantic Text Segments
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chunks.length === 0 ? (
              <div className="text-center p-6 text-xs text-slate-500">
                No chunks extracted yet.
              </div>
            ) : (
              chunks.map((chunk) => (
                <button
                  key={chunk.id}
                  onClick={() => setSelectedChunk(chunk)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 text-xs ${
                    selectedChunk?.id === chunk.id
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-300 font-medium"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 opacity-80">
                    <span>Segment #{chunk.chunk_index + 1}</span>
                    <span>Page {chunk.metadata.page || 1}</span>
                  </div>
                  <p className="line-clamp-2 leading-relaxed text-slate-350">
                    {chunk.content}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Right Side: Selected Chunk details */}
        <section className="flex-1 flex flex-col bg-slate-950/20 min-h-0 overflow-y-auto p-8">
          {selectedChunk ? (
            <div className="max-w-3xl space-y-6">
              {/* Chunk metadata banner */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Selected Chunk</span>
                  <span className="text-sm font-semibold text-slate-200">Segment {selectedChunk.chunk_index + 1} of {chunks.length}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Page Context</span>
                  <span className="font-semibold text-slate-200">Page {selectedChunk.metadata.page || 1}</span>
                </div>
              </div>

              {/* Chunk Content */}
              <div className="bg-slate-900/30 border border-white/5 p-8 rounded-2xl relative min-h-[250px] shadow-lg">
                <Quote className="absolute top-4 left-4 text-white/5 h-16 w-16 pointer-events-none" />
                <p className="text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-serif pl-4 border-l-2 border-blue-500/40">
                  {selectedChunk.content}
                </p>
              </div>

              {/* Detailed Technical Metadata */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-4">
                <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Source Context Metadata</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Mime Type</span>
                    <span className="font-medium text-slate-200">{evidence.mime_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Size</span>
                    <span className="font-medium text-slate-200">{Math.round((evidence.file_size_bytes || 0) / 1024)} KB</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Pore Size/Specs</span>
                    <span className="font-medium text-slate-200">{selectedChunk.metadata.pore_size_micron ? `${selectedChunk.metadata.pore_size_micron} µm` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
              <FileText size={32} className="mb-2" />
              <span>Select a semantic segment to inspect.</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
