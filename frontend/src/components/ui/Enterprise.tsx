import React from 'react'
import { Badge } from './Badge'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { AlertCircle, ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, FileText, Activity, Clock, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types & Enums
// ============================================================================
export type AgentState = 'IDLE' | 'QUEUED' | 'PROCESSING' | 'BLOCKED' | 'WAITING' | 'COMPLETE' | 'FAILED'
export type InvestigationStage = 'GATHERING' | 'REASONING' | 'WAITING' | 'REVIEW' | 'APPROVED' | 'CLOSED'

// ============================================================================
// Confidence Badge
// ============================================================================
export function ConfidenceBadge({ score, label, className }: { score: number; label?: string; className?: string }) {
  let variant: 'green' | 'amber' | 'red' = 'green'
  if (score < 70) variant = 'red'
  else if (score < 90) variant = 'amber'

  return (
    <div className={cn("flex flex-col items-start", className)}>
      {label && <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">{label}</span>}
      <Badge variant={variant} className="font-mono font-bold tracking-tight text-sm px-2.5 py-1">
        {score}%
      </Badge>
    </div>
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
export function InvestigationStageBadge({ stage }: { stage: InvestigationStage }) {
  const isComplete = stage === 'APPROVED' || stage === 'CLOSED'
  return (
    <Badge variant={isComplete ? 'green' : 'blue'} className="uppercase tracking-wide">
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
export function EvidenceCard({ title, type, timestamp, source, verified = false, confidence, summary }: { title: string; type: string; timestamp: string; source: string; verified?: boolean; confidence?: number; summary?: string }) {
  return (
    <Card padding="sm" interactive glowColor="blue" className="group">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{title}</h4>
            {verified && <Badge variant="green" size="xs" icon={<ShieldCheck className="w-3 h-3"/>}>Verified</Badge>}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="uppercase tracking-wider font-medium">{type}</span>
            <span>•</span>
            <span>{source}</span>
            <span>•</span>
            <span>{timestamp}</span>
            {confidence !== undefined && (
              <>
                <span>•</span>
                <span className="text-blue-400 font-mono">{confidence}% Conf</span>
              </>
            )}
          </div>
          {summary && (
            <p className="text-xs text-slate-400 border-l-2 border-blue-500/30 pl-2 py-0.5">{summary}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// Runtime Agent Card
// ============================================================================
export function RuntimeAgentCard({ name, status, confidence }: { name: string; status: AgentState; confidence?: number }) {
  const isActive = status === 'PROCESSING'
  const isError = status === 'FAILED'
  const isComplete = status === 'COMPLETE'
  
  let dotColor = "bg-slate-600"
  if (isActive) dotColor = "bg-violet-400 animate-pulse shadow-ai"
  else if (isComplete) dotColor = "bg-emerald-400"
  else if (isError) dotColor = "bg-red-400"
  else if (status === 'WAITING' || status === 'BLOCKED') dotColor = "bg-amber-400"

  return (
    <Card padding="sm" className="bg-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
          <span className="text-sm font-medium text-slate-300">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{status}</span>
          {confidence !== undefined && (
            <span className="text-xs font-mono text-slate-400">{confidence}%</span>
          )}
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// Metric Tile
// ============================================================================
export function MetricTile({ label, value, icon: Icon, color = 'blue', trend, delta }: { label: string; value: string | number; icon: any; color?: 'blue' | 'violet' | 'amber' | 'emerald' | 'red'; trend?: 'up' | 'down' | 'neutral'; delta?: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">{label}</span>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-xl font-bold text-slate-200">{value}</span>
          {delta && trend && (
            <span className={cn(
              "flex items-center text-xs font-medium mb-1",
              trend === 'up' ? "text-emerald-400" : trend === 'down' ? "text-red-400" : "text-slate-400"
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
              {delta}
            </span>
          )}
        </div>
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
export function NextBestActionCard({ title, missingEvidence, expectedConfidence, estimatedTime, actionLabel, onAction }: { title: string; missingEvidence?: string; expectedConfidence?: number; estimatedTime?: string; actionLabel: string; onAction?: () => void }) {
  return (
    <Card padding="md" elevated className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-transparent">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Next Best Action</span>
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {missingEvidence && (
              <p className="text-sm text-slate-400 mt-1">Missing Evidence: <span className="text-slate-200">{missingEvidence}</span></p>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium">
            {expectedConfidence !== undefined && (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                <TrendingUp className="w-3 h-3" />
                Expected Confidence: {expectedConfidence}%
              </div>
            )}
            {estimatedTime && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3 h-3" />
                {estimatedTime}
              </div>
            )}
          </div>
        </div>

        <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={onAction} className="shrink-0 md:mt-2">
          {actionLabel}
        </Button>
      </div>
    </Card>
  )
}
