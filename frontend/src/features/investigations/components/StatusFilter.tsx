import { cn } from '@/lib/utils'
import type { InvestigationStatus } from '@/types'

// ============================================================
// StatusFilter
// ============================================================
interface StatusFilterProps {
  value: InvestigationStatus | ''
  onChange: (status: InvestigationStatus | '') => void
}

const statusOptions: { value: InvestigationStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'closed', label: 'Closed' },
]

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
      {statusOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
            value === opt.value
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
