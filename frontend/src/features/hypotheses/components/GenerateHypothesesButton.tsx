import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface GenerateHypothesesButtonProps {
  onGenerate: (num: number) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const GenerateHypothesesButton: React.FC<GenerateHypothesesButtonProps> = ({
  onGenerate,
  isLoading,
  disabled,
}) => {
  const [numHypotheses, setNumHypotheses] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(numHypotheses);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-violet-400" />
        <span className="text-sm font-medium text-slate-300">Generate Root Cause Hypotheses:</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <select
          value={numHypotheses}
          onChange={(e) => setNumHypotheses(Number(e.target.value))}
          disabled={isLoading || disabled}
          className="px-2 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
        >
          <option value={1}>1 Hypothesis</option>
          <option value={2}>2 Hypotheses</option>
          <option value={3}>3 Hypotheses</option>
          <option value={4}>4 Hypotheses</option>
          <option value={5}>5 Hypotheses</option>
        </select>

        <button
          type="submit"
          disabled={isLoading || disabled}
          className="flex items-center gap-2 px-4 py-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-lg font-medium transition-all shadow-md shadow-violet-950/20 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span>Analyzing Evidence...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate (Gemma 3)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
