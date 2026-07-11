import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, X, FileText, AlertCircle, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { useCreateInvestigation } from '../api/useInvestigations'
import { EvidenceUploadZone } from '@/features/evidence/components/EvidenceUploadZone'

// ============================================================
// Form Schema
// ============================================================
const step1Schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please provide more detail (at least 10 characters)').max(2000),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
})

type Step1Data = z.infer<typeof step1Schema>

// ============================================================
// Step indicator
// ============================================================
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                        transition-all duration-300
                        ${i < current
                ? 'bg-blue-600 text-white'
                : i === current
                ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                : 'bg-white/5 border border-white/15 text-slate-500'
              }`}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`w-8 h-0.5 rounded transition-colors duration-300
                          ${i < current ? 'bg-blue-600' : 'bg-white/10'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// CreateInvestigationModal
// ============================================================
interface CreateInvestigationModalProps {
  open: boolean
  onClose: () => void
}

const STEP_LABELS = ['Basic Info', 'Evidence', 'Review']

export function CreateInvestigationModal({ open, onClose }: CreateInvestigationModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const createMutation = useCreateInvestigation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { severity: 'medium' },
  })

  const titleValue = watch('title')

  const handleClose = () => {
    reset()
    setStep(0)
    setCreatedId(null)
    onClose()
  }

  const onStep1Submit = async (data: Step1Data) => {
    const inv = await createMutation.mutateAsync(data)
    setCreatedId(inv.id)
    setStep(1)
  }

  const handleFinish = () => {
    if (createdId) {
      navigate(`/app/investigations/${createdId}`)
    }
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      showCloseButton={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 -mt-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">New Investigation</h2>
          <p className="text-xs text-slate-500 mt-0.5">{STEP_LABELS[step]}</p>
        </div>
        <div className="flex items-center gap-4">
          <StepIndicator current={step} total={STEP_LABELS.length} />
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
              <Input
                label="Investigation Title"
                placeholder="e.g., Q3 Batch Recall — Tablet Line 4 Contamination"
                error={errors.title?.message}
                required
                {...register('title')}
              />
              <Textarea
                label="Description"
                placeholder="Describe the event, observation, or deviation that triggered this investigation..."
                rows={4}
                error={errors.description?.message}
                required
                {...register('description')}
              />
              <Select
                label="Severity"
                options={[
                  { value: 'critical', label: '🔴 Critical — Immediate risk to patient safety' },
                  { value: 'high', label: '🟠 High — Significant quality impact' },
                  { value: 'medium', label: '🟡 Medium — Moderate concern' },
                  { value: 'low', label: '🟢 Low — Minor or precautionary' },
                ]}
                required
                {...register('severity')}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={createMutation.isPending}
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Create & Continue
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 1 && createdId && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">
                Investigation <strong>"{titleValue}"</strong> created successfully.
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-300 mb-3 font-medium">
                Upload initial evidence files (optional — you can add more later)
              </p>
              <EvidenceUploadZone investigationId={createdId} compact />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)} icon={<ChevronLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Investigation Ready</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your investigation is set up. You can now view it and run AI hypothesis generation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/3 border border-white/8">
                <FileText className="w-4 h-4 text-blue-400 mb-2" />
                <p className="text-xs font-medium text-slate-300">Add Evidence</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Upload PDFs, images, logs</p>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-white/8">
                <AlertCircle className="w-4 h-4 text-violet-400 mb-2" />
                <p className="text-xs font-medium text-slate-300">Generate Hypotheses</p>
                <p className="text-[11px] text-slate-500 mt-0.5">AI-powered root cause analysis</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} icon={<ChevronLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={handleFinish} variant="ai" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
                Open Investigation
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
