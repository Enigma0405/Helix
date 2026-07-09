import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/hooks/useToast'
import type { User } from '@/types'

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
      const access_token: string = tokenRes.data.access_token

      // Step 2: fetch user profile using the new token
      const meRes = await authApi.me(access_token)
      const meData = meRes.data as { user: Record<string, unknown>; organization: Record<string, unknown> }

      // Map backend UserOut → frontend User shape
      const user: User = {
        id: String(meData.user.id),
        email: String(meData.user.email),
        full_name: meData.user.full_name != null ? String(meData.user.full_name) : null,
        role: meData.user.role as User['role'],
        org_id: String(meData.user.org_id),
        org_name: meData.organization.name != null ? String(meData.organization.name) : undefined,
      }

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
