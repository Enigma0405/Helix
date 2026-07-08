import axios from 'axios'
import { useAuthStore } from '@/store/auth'

// ============================================================
// Axios Client Instance
// ============================================================
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// ============================================================
// Request Interceptor — Attach JWT token
// ============================================================
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================
// Response Interceptor — Handle 401 globally
// ============================================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state
      useAuthStore.getState().logout()
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============================================================
// Typed API helper functions
// ============================================================

// Auth
export const authApi = {
  login: (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return apiClient.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => apiClient.get('/auth/me'),
}

// Investigations
export const investigationsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/investigations', { params }),
  get: (id: string) => apiClient.get(`/investigations/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/investigations', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/investigations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/investigations/${id}`),
  stats: () => apiClient.get('/investigations/stats'),
}

// Evidence
export const evidenceApi = {
  list: (investigationId: string) =>
    apiClient.get(`/investigations/${investigationId}/evidence`),
  get: (investigationId: string, evidenceId: string) =>
    apiClient.get(`/investigations/${investigationId}/evidence/${evidenceId}`),
  upload: (investigationId: string, formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient.post(`/investigations/${investigationId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      },
    }),
  delete: (investigationId: string, evidenceId: string) =>
    apiClient.delete(`/investigations/${investigationId}/evidence/${evidenceId}`),
  getChunks: (investigationId: string, evidenceId: string) =>
    apiClient.get(`/investigations/${investigationId}/evidence/${evidenceId}/chunks`),
}

// Hypotheses
export const hypothesesApi = {
  list: (investigationId: string) =>
    apiClient.get(`/investigations/${investigationId}/hypotheses`),
  generate: (investigationId: string, data?: Record<string, unknown>) =>
    apiClient.post(`/investigations/${investigationId}/hypotheses/generate`, data ?? {}),
  update: (investigationId: string, hypothesisId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/investigations/${investigationId}/hypotheses/${hypothesisId}`, data),
  delete: (investigationId: string, hypothesisId: string) =>
    apiClient.delete(`/investigations/${investigationId}/hypotheses/${hypothesisId}`),
}

// CAPA
export const capaApi = {
  get: (investigationId: string) =>
    apiClient.get(`/investigations/${investigationId}/capa`),
  generate: (investigationId: string) =>
    apiClient.post(`/investigations/${investigationId}/capa/generate`, {}),
  update: (investigationId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/investigations/${investigationId}/capa`, data),
  approve: (investigationId: string) =>
    apiClient.post(`/investigations/${investigationId}/capa/approve`, {}),
}

// Audit
export const auditApi = {
  list: (investigationId: string) =>
    apiClient.get(`/investigations/${investigationId}/audit`),
}

// AI Provider info
export const runtimeApi = {
  info: () => apiClient.get('/runtime/info'),
}

export default apiClient
