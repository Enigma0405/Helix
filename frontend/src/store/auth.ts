import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

// ============================================================
// Auth State Interface
// ============================================================
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean

  // Actions
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

// ============================================================
// Zustand Auth Store with localStorage persistence
// ============================================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'helix-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist token and user (not computed isAuthenticated)
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ============================================================
// Selector hooks for performance optimization
// ============================================================
export const useCurrentUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
export const useAuthToken = () => useAuthStore((s) => s.token)
export const useUserRole = () => useAuthStore((s) => s.user?.role)

// ============================================================
// Role-based access helpers
// ============================================================
export function canApprove(role: string | undefined): boolean {
  return role === 'admin' || role === 'reviewer'
}

export function canManage(role: string | undefined): boolean {
  return role === 'admin' || role === 'analyst'
}

export function isAdmin(role: string | undefined): boolean {
  return role === 'admin'
}
