import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/hooks/useToast'

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
      // Step 1: get tokens
      const tokenRes = await authApi.login(email, password)
      const { access_token } = tokenRes.data

      // Step 2: fetch user profile using the token
      const meRes = await authApi.me(access_token)
      const { user } = meRes.data

      return { access_token, user }
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
