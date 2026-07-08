import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evidenceApi } from '@/api/client'
import { toast } from '@/hooks/useToast'
import type { EvidenceItem, EvidenceChunk } from '@/types'

// ============================================================
// Query Keys
// ============================================================
export const EVIDENCE_KEYS = {
  all: (investigationId: string) => ['evidence', investigationId] as const,
  list: (investigationId: string) =>
    [...EVIDENCE_KEYS.all(investigationId), 'list'] as const,
  detail: (investigationId: string, evidenceId: string) =>
    [...EVIDENCE_KEYS.all(investigationId), 'detail', evidenceId] as const,
  chunks: (investigationId: string, evidenceId: string) =>
    [...EVIDENCE_KEYS.all(investigationId), 'chunks', evidenceId] as const,
}

// ============================================================
// useEvidenceList
// ============================================================
export function useEvidenceList(investigationId: string) {
  return useQuery({
    queryKey: EVIDENCE_KEYS.list(investigationId),
    queryFn: async () => {
      const response = await evidenceApi.list(investigationId)
      return response.data as EvidenceItem[]
    },
    enabled: Boolean(investigationId),
    staleTime: 15_000,
    refetchInterval: (query) => {
      // Poll if any evidence is still processing
      const data = query.state.data as EvidenceItem[] | undefined
      const hasProcessing = data?.some((e) => e.status === 'processing' || e.status === 'uploaded')
      return hasProcessing ? 5_000 : false
    },
  })
}

// ============================================================
// useEvidenceChunks
// ============================================================
export function useEvidenceChunks(investigationId: string, evidenceId: string) {
  return useQuery({
    queryKey: EVIDENCE_KEYS.chunks(investigationId, evidenceId),
    queryFn: async () => {
      const response = await evidenceApi.getChunks(investigationId, evidenceId)
      return response.data as EvidenceChunk[]
    },
    enabled: Boolean(investigationId) && Boolean(evidenceId),
    staleTime: 60_000,
  })
}

// ============================================================
// useUploadEvidence
// ============================================================
export function useUploadEvidence(investigationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (pct: number) => void
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await evidenceApi.upload(investigationId, formData, onProgress)
      return response.data as EvidenceItem
    },
    onSuccess: (evidence) => {
      queryClient.invalidateQueries({ queryKey: EVIDENCE_KEYS.list(investigationId) })
      toast.success('File uploaded', `"${evidence.original_filename}" is being processed.`)
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const msg = error?.response?.data?.detail ?? 'Upload failed. Please try again.'
      toast.error('Upload failed', msg)
    },
  })
}

// ============================================================
// useDeleteEvidence
// ============================================================
export function useDeleteEvidence(investigationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (evidenceId: string) => {
      await evidenceApi.delete(investigationId, evidenceId)
      return evidenceId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVIDENCE_KEYS.list(investigationId) })
      toast.success('Evidence deleted')
    },
    onError: () => {
      toast.error('Error', 'Failed to delete evidence.')
    },
  })
}
