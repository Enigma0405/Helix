import React from 'react'
import { Badge } from './Badge'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { AlertCircle, ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, FileText, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Confidence Badge
// ============================================================================
export function ConfidenceBadge({ score, className }: { score: number; className?: string }) {
  let variant: 'green' | 'amber' | 'red' = 'green'
  if (score < 70) variant = 'red'
  else if (score < 90) variant = 'amber'

  return (
    <Badge variant={variant} className={cn("font-mono font-bold tracking-tight", className)}>
      {score}% Confidence
    </Badge>
  )
}

// ============================================================================
// AI Status Chip
// ============================================================================
export function AIStatusChip({ status, active = false }: { status: string; active?: boolean }) {
  return (
    <Badge
      variant={active ? 'ai' : 'default'}
      dot
      pulseDot={active}
      icon={<BrainCircuit className="w-3 h-3" />}
      className="uppercase tracking-wider text-[10px]"
    >
      {status}
    </Badge>
  )
}

// ============================================================================
// Investigation Stage Badge
// ============================================================================
export function InvestigationStageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant="blue" className="uppercase tracking-wide">
      {stage}
    </Badge>
  )
}

// ============================================================================
// Risk Badge
// ============================================================================
export function RiskBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const variant = level === 'High' ? 'red' : level === 'Medium' ? 'amber' : 'green'
  return (
    <Badge variant={variant} icon={<AlertCircle className="w-3 h-3" />}>
      {level} Risk
    </Badge>
  )
}

// ============================================================================
// Evidence Card
// ============================================================================
export function EvidenceCard({ title, type, timestamp, source }: { title: string; type: string; timestamp: string; source: string }) {
  return (
    <Card padding="sm" interactive glowColor="blue" className="group">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{title}</h4>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="uppercase tracking-wider font-medium">{type}</span>
            <span>•</span>
            <span>{source}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// Runtime Agent Card
// ============================================================================
export function RuntimeAgentCard({ name, status, confidence }: { name: string; status: 'Active' | 'Idle' | 'Complete'; confidence?: number }) {
  const isActive = status === 'Active'
  return (
    <Card padding="sm" className="bg-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isActive ? "bg-violet-400 animate-pulse shadow-ai" : status === 'Complete' ? "bg-emerald-400" : "bg-slate-600"
          )} />
          <span className="text-sm font-medium text-slate-300">{name}</span>
        </div>
        {confidence !== undefined && (
          <span className="text-xs font-mono text-slate-500">{confidence}%</span>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// Metric Tile
// ============================================================================
export function MetricTile({ label, value, icon: Icon, color = 'blue' }: { label: string; value: string | number; icon: any; color?: 'blue' | 'violet' | 'amber' | 'emerald' | 'red' }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">{label}</span>
        <span className="text-xl font-bold text-slate-200 mt-1 block">{value}</span>
      </div>
      <div className={cn(
        "h-10 w-10 rounded-lg border flex items-center justify-center shrink-0",
        color === 'blue' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
        color === 'violet' && "bg-violet-500/10 border-violet-500/20 text-violet-400",
        color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
        color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        color === 'red' && "bg-red-500/10 border-red-500/20 text-red-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

// ============================================================================
// Next Best Action Card
// ============================================================================
export function NextBestActionCard({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction?: () => void }) {
  return (
    <Card padding="md" elevated className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-transparent">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Next Best Action</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={onAction} className="shrink-0 mt-2">
          {actionLabel}
        </Button>
      </div>
    </Card>
  )
}
