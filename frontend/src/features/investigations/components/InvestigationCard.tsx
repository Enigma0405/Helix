import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileSearch,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
} from 'lucide-react'
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import type { Investigation } from '@/types'

// ============================================================
// InvestigationCard
// ============================================================
interface InvestigationCardProps {
  investigation: Investigation
  index?: number
}

export function InvestigationCard({ investigation, index = 0 }: InvestigationCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      onClick={() => navigate(`/app/investigations/${investigation.id}`)}
      className="glass-card p-5 hover:bg-white/8 cursor-pointer transition-all duration-300
                 hover:border-white/20 hover:shadow-helix group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/investigations/${investigation.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20
                          group-hover:bg-blue-500/15 transition-colors">
            <FileSearch className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-blue-300
                           transition-colors">
              {investigation.title}
            </h3>
            {investigation.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                {investigation.description}
              </p>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-0.5
                                  group-hover:text-slate-400 group-hover:translate-x-0.5
                                  transition-all duration-200" />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <StatusBadge status={investigation.status} />
        <SeverityBadge severity={investigation.severity} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(investigation.created_at)}</span>
        </div>
        {investigation.evidence_count !== undefined && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <FileText className="w-3 h-3" />
            <span>{investigation.evidence_count} evidence</span>
          </div>
        )}
        {investigation.hypothesis_count !== undefined && investigation.hypothesis_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-violet-500">
            <FlaskConical className="w-3 h-3" />
            <span>{investigation.hypothesis_count} hypotheses</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
