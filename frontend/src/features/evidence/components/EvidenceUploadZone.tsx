import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useUploadEvidence } from '../api/useEvidence'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatFileSize, cn } from '@/lib/utils'

// ============================================================
// Upload item state
// ============================================================
interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

// ============================================================
// EvidenceUploadZone
// ============================================================
interface EvidenceUploadZoneProps {
  investigationId: string
  compact?: boolean
}

export function EvidenceUploadZone({
  investigationId,
  compact = false,
}: EvidenceUploadZoneProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const uploadMutation = useUploadEvidence(investigationId)

  const processFile = useCallback(
    async (item: UploadItem) => {
      setUploadQueue((q) =>
        q.map((u) => (u.id === item.id ? { ...u, status: 'uploading' } : u))
      )

      try {
        await uploadMutation.mutateAsync({
          file: item.file,
          onProgress: (pct) => {
            setUploadQueue((q) =>
              q.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
            )
          },
        })
        setUploadQueue((q) =>
          q.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100 } : u))
        )
        // Auto-remove after success
        setTimeout(() => {
          setUploadQueue((q) => q.filter((u) => u.id !== item.id))
        }, 2500)
      } catch {
        setUploadQueue((q) =>
          q.map((u) =>
            u.id === item.id ? { ...u, status: 'error', error: 'Upload failed' } : u
          )
        )
      }
    },
    [uploadMutation]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newItems: UploadItem[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        progress: 0,
        status: 'pending',
      }))

      setUploadQueue((q) => [...q, ...newItems])

      // Start uploading
      newItems.forEach((item) => processFile(item))
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.log'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'message/rfc822': ['.eml'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const removeItem = (id: string) => {
    setUploadQueue((q) => q.filter((u) => u.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
          'flex flex-col items-center justify-center text-center',
          compact ? 'p-6' : 'p-10',
          isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-500/10'
            : isDragReject
            ? 'border-red-500 bg-red-500/10'
            : 'border-white/15 bg-white/3 hover:border-blue-500/40 hover:bg-blue-500/5'
        )}
      >
        <input {...getInputProps()} aria-label="Upload evidence files" />

        {/* Animated upload icon */}
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          className={cn(
            'p-4 rounded-2xl mb-3',
            isDragActive
              ? 'bg-blue-500/20 border border-blue-500/40'
              : 'bg-white/5 border border-white/10'
          )}
        >
          <Upload
            className={cn(
              'transition-colors duration-200',
              compact ? 'w-6 h-6' : 'w-8 h-8',
              isDragActive ? 'text-blue-400' : 'text-slate-500'
            )}
          />
        </motion.div>

        <p className={cn('font-medium text-slate-300', compact ? 'text-sm' : 'text-base')}>
          {isDragActive ? (
            isDragReject ? 'File type not supported' : 'Drop files here'
          ) : (
            'Drag & drop evidence files'
          )}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          PDF, Word (.doc/.docx), CSV, TXT, Log, Email (.eml) up to 100MB
        </p>
        {!compact && (
          <div className="mt-3 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
            or <span className="text-blue-400 font-medium">browse files</span>
          </div>
        )}
      </div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border',
                item.status === 'error'
                  ? 'bg-red-500/8 border-red-500/20'
                  : item.status === 'done'
                  ? 'bg-emerald-500/8 border-emerald-500/20'
                  : 'bg-white/3 border-white/8'
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {item.status === 'done' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : item.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : item.status === 'uploading' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <File className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{item.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500">
                    {formatFileSize(item.file.size)}
                  </span>
                  {item.status === 'uploading' && (
                    <ProgressBar value={item.progress} size="xs" color="blue" className="flex-1" />
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] text-red-400">{item.error}</span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-[10px] text-emerald-400">Uploaded</span>
                  )}
                </div>
              </div>

              {/* Remove */}
              {item.status !== 'uploading' && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
