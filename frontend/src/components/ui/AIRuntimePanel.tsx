import React, { useEffect, useState } from 'react'
import { runtimeApi } from '@/api/client'
import Spinner from './Spinner'

interface TelemetryData {
  provider: string
  model: string
  preferred_model: string
  fallback_triggered: boolean
  architecture: string
  total_calls: number
  average_latency_ms: number
  total_cost_usd: number
}

export const AIRuntimePanel: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTelemetry = async () => {
    try {
      setLoading(true)
      const res = await runtimeApi.getTelemetry()
      setTelemetry(res.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load AI Runtime telemetry:', err)
      setError('Telemetry Unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    // Poll every 15 seconds to keep latency and stats fresh
    const interval = setInterval(fetchTelemetry, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !telemetry) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800">
        <Spinner className="w-5 h-5 text-indigo-500 mr-2" />
        <span className="text-sm text-slate-400 font-medium">Resolving AI Runtime telemetry...</span>
      </div>
    )
  }

  if (error || !telemetry) {
    return (
      <div className="p-4 bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-900/30 text-center">
        <span className="text-sm text-red-400 font-medium">{error || 'Telemetry Offline'}</span>
      </div>
    )
  }

  const {
    provider,
    model,
    preferred_model,
    fallback_triggered,
    architecture,
    total_calls,
    average_latency_ms,
    total_cost_usd,
  } = telemetry

  return (
    <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-lg">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            AMD-Optimized AI Runtime
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">Telemetry Active</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Provider */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
          <span className="block text-xs text-slate-500 font-medium mb-1">Active Provider</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
            {provider}
          </span>
        </div>

        {/* Model */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50 md:col-span-1">
          <span className="block text-xs text-slate-500 font-medium mb-1">Active Model</span>
          <span className="block text-xs text-slate-300 font-mono truncate" title={model}>
            {model.split('/').pop()}
          </span>
        </div>

        {/* Latency */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
          <span className="block text-xs text-slate-500 font-medium mb-1">Avg Latency</span>
          <span className="block text-sm font-semibold text-slate-200 font-mono">
            {average_latency_ms > 0 ? `${(average_latency_ms / 1000).toFixed(2)}s` : 'N/A (Cached)'}
          </span>
        </div>
      </div>

      {/* Fallback Banner (If triggered) */}
      {fallback_triggered && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center space-x-2">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xs text-amber-400">
            <span className="font-semibold block">Gemma 4 Fallback Triggered</span>
            The allowlisted model returned 404. Cascaded to DeepSeek Pro via client adapter.
          </div>
        </div>
      )}

      {/* Architecture Spec */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-500 space-y-2 md:space-y-0">
        <span className="font-medium">{architecture}</span>
        <div className="flex items-center space-x-3 font-mono">
          <span>Calls: {total_calls}</span>
          <span>•</span>
          <span>Cost: ${total_cost_usd.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}
