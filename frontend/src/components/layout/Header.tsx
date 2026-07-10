import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, LogOut, User, Settings, ChevronDown, Cpu } from 'lucide-react'
import { useAuthStore, useCurrentUser } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ============================================================
// Header Component
// ============================================================
interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const user = useCurrentUser()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between
                        px-5 py-3 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-md">
      {/* Left: Page title */}
      <div>
        {title && (
          <h1 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h1>
        )}
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wide font-medium">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions + user menu */}
      <div className="flex items-center gap-3">
        {/* Custom actions slot */}
        {actions}

        {/* New Investigation CTA */}
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => navigate('/app/investigations/new')}
        >
          New Investigation
        </Button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200
                     hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-lg
                       hover:bg-white/5 transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                            flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-300 leading-tight">
                {user?.full_name ?? user?.email ?? 'User'}
              </p>
              <p className="text-[10px] text-slate-500 capitalize leading-tight">
                {user?.role}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'w-3 h-3 text-slate-500 transition-transform duration-200',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                {/* Dropdown */}
                <motion.div
                  className="absolute right-0 top-full mt-2 w-52 z-20
                             bg-[#1E293B] border border-white/10 rounded-xl shadow-glass
                             overflow-hidden"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-semibold text-slate-100">
                      {user?.full_name ?? 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                 text-sm text-slate-300 hover:text-slate-100
                                 hover:bg-white/5 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                 text-sm text-slate-300 hover:text-slate-100
                                 hover:bg-white/5 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </button>
                    <button
                      onClick={() => { navigate('/settings#ai'); setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                 text-sm text-slate-300 hover:text-slate-100
                                 hover:bg-white/5 transition-colors text-left"
                    >
                      <Cpu className="w-4 h-4 text-violet-400" />
                      AI Runtime
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="p-1.5 border-t border-white/8">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                 text-sm text-red-400 hover:text-red-300
                                 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
