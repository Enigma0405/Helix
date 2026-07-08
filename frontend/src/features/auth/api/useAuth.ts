import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/hooks/useToast'
import type { AuthResponse } from '@/types'

// ============================================================
// Auth query keys
// ============================================================
export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
}

// ============================================================
// useLogin mutation
// ============================================================
export function useLogin() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authApi.login(email, password)
      return response.data as AuthResponse
    },
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
      toast.success('Welcome back!', `Signed in as ${data.user.email}`)
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const msg = error?.response?.data?.detail ?? 'Invalid credentials. Please try again.'
      toast.error('Login failed', msg)
    },
  })
}
