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
      return (response.data as { items: EvidenceItem[] }).items
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
      // Demo mode: mock the upload to avoid MinIO dependency
      if (onProgress) {
        onProgress(30)
        await new Promise(resolve => setTimeout(resolve, 300))
        onProgress(75)
        await new Promise(resolve => setTimeout(resolve, 300))
        onProgress(100)
      }
      
      const mockEvidence: EvidenceItem = {
        id: `EV-MOCK-${Date.now()}`,
        investigation_id: investigationId,
        original_filename: file.name,
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        status: 'processed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return mockEvidence
    },
    onSuccess: (evidence) => {
      queryClient.setQueryData(EVIDENCE_KEYS.list(investigationId), (old: EvidenceItem[] | undefined) => {
        return [...(old || []), evidence]
      })
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
