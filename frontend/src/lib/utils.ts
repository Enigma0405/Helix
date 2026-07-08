import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  InvestigationSeverity,
  InvestigationStatus,
  EvidenceStatus,
  HypothesisStatus,
  CapaStatus,
  AuditAction,
} from '@/types'

// ============================================================
// Class name merging
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// Date / Time formatting
// ============================================================
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateString)
}

// ============================================================
// File size formatting
// ============================================================
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ============================================================
// Severity helpers
// ============================================================
export const severityConfig: Record<
  InvestigationSeverity,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  low: {
    label: 'Low',
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
}

// ============================================================
// Status helpers
// ============================================================
export const statusConfig: Record<
  InvestigationStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  open: {
    label: 'Open',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  closed: {
    label: 'Closed',
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
}

// ============================================================
// Evidence Status helpers
// ============================================================
export const evidenceStatusConfig: Record<
  EvidenceStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  uploaded: {
    label: 'Uploaded',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  processing: {
    label: 'Processing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  processed: {
    label: 'Processed',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
}

// ============================================================
// Hypothesis Status helpers
// ============================================================
export const hypothesisStatusConfig: Record<
  HypothesisStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  modified: {
    label: 'Modified',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
}

// ============================================================
// CAPA Status helpers
// ============================================================
export const capaStatusConfig: Record<
  CapaStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  review: {
    label: 'Under Review',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
}

// ============================================================
// Audit action labels
// ============================================================
export function getAuditActionLabel(action: AuditAction | string): string {
  const labels: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    status_changed: 'Status Changed',
    approved: 'Approved',
    rejected: 'Rejected',
    accepted: 'Accepted',
    evidence_uploaded: 'Evidence Uploaded',
    evidence_processed: 'Evidence Processed',
    hypotheses_generated: 'Hypotheses Generated',
    capa_generated: 'CAPA Generated',
    capa_approved: 'CAPA Approved',
  }
  return labels[action] ?? action
}

// ============================================================
// String helpers
// ============================================================
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function getInitials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + 's')
}

// ============================================================
// Score / confidence formatting
// ============================================================
export function formatScore(score: number | null | undefined): string {
  if (score == null) return 'N/A'
  return `${Math.round(score * 100)}%`
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-slate-500'
  if (score >= 0.8) return 'text-emerald-400'
  if (score >= 0.6) return 'text-blue-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-red-400'
}

export function getScoreBarColor(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-600'
  if (score >= 0.8) return 'bg-emerald-500'
  if (score >= 0.6) return 'bg-blue-500'
  if (score >= 0.4) return 'bg-amber-500'
  return 'bg-red-500'
}

// ============================================================
// MIME type to icon name
// ============================================================
export function mimeTypeToIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'video'
  if (mimeType.includes('audio')) return 'audio-lines'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table'
  if (mimeType.includes('json') || mimeType.includes('xml')) return 'code'
  if (mimeType.includes('text')) return 'file-text'
  return 'file'
}

// ============================================================
// Debounce
// ============================================================
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
