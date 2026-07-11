import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { CAPA } from "@/types";

export const capaKeys = {
  all: ["capas"] as const,
  detail: (investigationId: string) => ["capas", "detail", investigationId] as const,
};

export function useCapa(investigationId: string) {
  return useQuery<CAPA>({
    queryKey: capaKeys.detail(investigationId),
    queryFn: async () => {
      const response = await apiClient.get(`/investigations/${investigationId}/capa`);
      return response.data;
    },
    enabled: !!investigationId,
    retry: false, // Prevents loading loops if CAPA is not yet drafted (404)
  });
}

export function useGenerateCapa() {
  const queryClient = useQueryClient();
  return useMutation<CAPA, Error, { investigationId: string; org_context?: string }>({
    mutationFn: async ({ investigationId, org_context = "" }) => {
      const response = await apiClient.post(`/investigations/${investigationId}/capa`, {
        org_context,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: capaKeys.detail(variables.investigationId) });
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
    },
  });
}

export function useUpdateCapa(investigationId: string) {
  const queryClient = useQueryClient();
  return useMutation<CAPA, Error, { capaId: string; content: string }>({
    mutationFn: async ({ capaId, content }) => {
      const response = await apiClient.patch(`/capa/${capaId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capaKeys.detail(investigationId) });
    },
  });
}

export function useApproveCapa(investigationId: string) {
  const queryClient = useQueryClient();
  return useMutation<CAPA, Error, { capaId: string }>({
    mutationFn: async ({ capaId }) => {
      const response = await apiClient.post(`/capa/${capaId}/approve`, { approved: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capaKeys.detail(investigationId) });
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
      queryClient.invalidateQueries({ queryKey: ["investigations", investigationId] });
    },
  });
}
export function useExportInvestigation() {
  return useMutation<{ id: string; storage_key: string; download_url?: string }, Error, { investigationId: string }>({
    mutationFn: async ({ investigationId }) => {
      const response = await apiClient.post(`/api/investigations/${investigationId}/export`, { format: "pdf" });
      return response.data;
    }
  });
}
