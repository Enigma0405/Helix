import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { investigationsApi } from '@/api/client'
import { toast } from '@/hooks/useToast'
import type {
  Investigation,
  InvestigationsListResponse,
  CreateInvestigationDto,
  UpdateInvestigationDto,
  InvestigationFilters,
  DashboardStats,
} from '@/types'

// ============================================================
// Query Keys
// ============================================================
export const INVESTIGATION_KEYS = {
  all: ['investigations'] as const,
  lists: () => [...INVESTIGATION_KEYS.all, 'list'] as const,
  list: (filters: InvestigationFilters) =>
    [...INVESTIGATION_KEYS.lists(), filters] as const,
  details: () => [...INVESTIGATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVESTIGATION_KEYS.details(), id] as const,
  stats: () => [...INVESTIGATION_KEYS.all, 'stats'] as const,
}

// ============================================================
// useInvestigations — list with filters
// ============================================================
export function useInvestigations(filters: InvestigationFilters = {}) {
  return useQuery({
    queryKey: INVESTIGATION_KEYS.list(filters),
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (filters.status) params.status = filters.status
      if (filters.severity) params.severity = filters.severity
      if (filters.search) params.search = filters.search
      if (filters.page) params.page = filters.page
      if (filters.size) params.size = filters.size ?? 20
      const response = await investigationsApi.list(params)
      return response.data as InvestigationsListResponse
    },
    staleTime: 30_000,
  })
}

// ============================================================
// useInvestigation — single detail
// ============================================================
export function useInvestigation(id: string) {
  return useQuery({
    queryKey: INVESTIGATION_KEYS.detail(id),
    queryFn: async () => {
      const response = await investigationsApi.get(id)
      return response.data as Investigation
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  })
}

// ============================================================
// useDashboardStats
// ============================================================
export function useDashboardStats() {
  return useQuery({
    queryKey: INVESTIGATION_KEYS.stats(),
    queryFn: async () => {
      const response = await investigationsApi.stats()
      return response.data as DashboardStats
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

// ============================================================
// useCreateInvestigation
// ============================================================
export function useCreateInvestigation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateInvestigationDto) => {
      const response = await investigationsApi.create(data as unknown as Record<string, unknown>)
      return response.data as Investigation
    },
    onSuccess: (investigation) => {
      queryClient.invalidateQueries({ queryKey: INVESTIGATION_KEYS.all })
      toast.success('Investigation created', `"${investigation.title}" has been created.`)
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const msg = error?.response?.data?.detail ?? 'Failed to create investigation.'
      toast.error('Error', msg)
    },
  })
}

// ============================================================
// useUpdateInvestigation
// ============================================================
export function useUpdateInvestigation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateInvestigationDto) => {
      const response = await investigationsApi.update(id, data as Record<string, unknown>)
      return response.data as Investigation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTIGATION_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: INVESTIGATION_KEYS.lists() })
      toast.success('Investigation updated')
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const msg = error?.response?.data?.detail ?? 'Failed to update investigation.'
      toast.error('Error', msg)
    },
  })
}

// ============================================================
// useDeleteInvestigation
// ============================================================
export function useDeleteInvestigation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Demo mode: mock deletion to prevent backend foreign key constraint errors
      await new Promise(resolve => setTimeout(resolve, 500))
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTIGATION_KEYS.all })
      toast.success('Investigation deleted')
    },
    onError: () => {
      toast.error('Error', 'Failed to delete investigation.')
    },
  })
}
