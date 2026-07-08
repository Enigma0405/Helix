import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Hypothesis } from "@/types";

export const hypothesisKeys = {
  all: ["hypotheses"] as const,
  list: (investigationId: string) => ["hypotheses", "list", investigationId] as const,
};

export function useHypotheses(investigationId: string) {
  return useQuery<Hypothesis[]>({
    queryKey: hypothesisKeys.list(investigationId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/investigations/${investigationId}/hypotheses`);
      return response.data;
    },
    enabled: !!investigationId,
  });
}

export function useGenerateHypotheses() {
  const queryClient = useQueryClient();
  return useMutation<Hypothesis[], Error, { investigationId: string; num_hypotheses: number }>({
    mutationFn: async ({ investigationId, num_hypotheses }) => {
      const response = await apiClient.post(
        `/api/investigations/${investigationId}/hypotheses`,
        { num_hypotheses }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hypothesisKeys.list(variables.investigationId) });
    },
  });
}

export function useUpdateHypothesis(investigationId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Hypothesis,
    Error,
    { hypothesisId: string; data: { status?: string; title?: string; content?: string } }
  >({
    mutationFn: async ({ hypothesisId, data }) => {
      const response = await apiClient.patch(`/api/hypotheses/${hypothesisId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hypothesisKeys.list(investigationId) });
      queryClient.invalidateQueries({ queryKey: ["investigations"] });
    },
  });
}
