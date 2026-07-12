import { useMutation } from "@tanstack/react-query";
import { investigationsApi } from "@/api/client";

export const useAssessInvestigation = (investigationId: string) => {
  return useMutation({
    mutationFn: async (question: string) => {
      const { data } = await investigationsApi.assess(investigationId, question);
      return data;
    },
  });
};
