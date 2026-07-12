import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { cn } from '@/lib/utils'

// ============================================================
// AppShell — main layout wrapper
// ============================================================
interface AppShellProps {
  headerTitle?: string
  headerSubtitle?: string
  headerActions?: React.ReactNode
}

export function AppShell({ headerTitle, headerSubtitle, headerActions }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden relative">
      
      {/* Demo Build Banner */}
      <div className="absolute top-0 right-0 z-[100] bg-violet-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-lg border-b border-l border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Demo Build v1.0 • EvidenceOps Preview
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={!sidebarOpen} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <motion.div
            className="relative z-50"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sidebar collapsed={false} />
          </motion.div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-3 text-slate-400 hover:text-slate-200"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {mobileSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Desktop sidebar toggle */}
          <button
            className="hidden lg:flex p-3 text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <Header
              title={headerTitle}
              subtitle={headerSubtitle}
              actions={headerActions}
            />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            className="min-h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
