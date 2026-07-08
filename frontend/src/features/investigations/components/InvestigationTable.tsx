import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileSearch, ChevronRight, MoreHorizontal, Trash2, Edit3 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { useDeleteInvestigation } from '../api/useInvestigations'
import type { Investigation } from '@/types'
import { cn } from '@/lib/utils'

// ============================================================
// Table Row Actions Menu
// ============================================================
function RowActionsMenu({
  investigation,
  onEdit,
}: {
  investigation: Investigation
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const deleteMutation = useDeleteInvestigation()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <motion.div
          className="absolute right-0 top-full mt-1 w-44 z-20
                     bg-[#1E293B] border border-white/10 rounded-xl shadow-glass"
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => { onEdit(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                         text-sm text-slate-300 hover:text-slate-100 hover:bg-white/5 text-left"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => {
                deleteMutation.mutate(investigation.id)
                setOpen(false)
              }}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                         text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ============================================================
// InvestigationTable
// ============================================================
interface InvestigationTableProps {
  investigations: Investigation[]
  loading?: boolean
  onEdit?: (investigation: Investigation) => void
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded shimmer bg-white/5" style={{ width: `${60 + (i * 13) % 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function InvestigationTable({
  investigations,
  loading = false,
  onEdit,
}: InvestigationTableProps) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="helix-table w-full">
        <thead>
          <tr className="bg-white/3">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Investigation
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Evidence
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">
              {/* Actions */}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : investigations.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <FileSearch className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-500 text-sm">No investigations found</p>
                </div>
              </td>
            </tr>
          ) : (
            investigations.map((inv, idx) => (
              <motion.tr
                key={inv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                onClick={() => navigate(`/investigations/${inv.id}`)}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/15">
                      <FileSearch className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100 hover:text-blue-300 transition-colors">
                        {inv.title}
                      </p>
                      {inv.description && (
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                          {inv.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <SeverityBadge severity={inv.severity} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-400">
                    {inv.evidence_count ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-400">
                    {formatRelativeTime(inv.created_at)}
                  </span>
                </td>
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu
                    investigation={inv}
                    onEdit={() => onEdit?.(inv)}
                  />
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
