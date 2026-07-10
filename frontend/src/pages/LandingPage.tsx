import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Sparkles, ArrowRight, Activity } from "lucide-react"

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-helix-lg">
            <span className="text-xl font-black text-white tracking-tight">H</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
            <Activity className="w-4 h-4 text-violet-400" />
            AI-Native EvidenceOps
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-100 tracking-tight">
            Every investigation is <span className="gradient-text-helix">alive</span>.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Helix is the enterprise operating system for manufacturing deviations. AI continuously observes, evidence enriches the investigation, and humans remain accountable.
          </p>
        </div>

        <div className="pt-8 flex items-center justify-center gap-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="px-8"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            className="px-8 border-white/10"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/login')}
          >
            Launch Demo
          </Button>
        </div>

        <div className="pt-16 flex items-center justify-center gap-8 opacity-50 grayscale">
          {/* Mock trusted by logos or just subtle text */}
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Apex Precision Biologics</span>
        </div>
      </div>
    </div>
  )
}
