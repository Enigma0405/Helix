import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  FlaskConical,
  Settings,
  Cpu,
  ChevronRight,
  Layers,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/store/auth'

// ============================================================
// Nav items
// ============================================================
const navItems = [
  {
    label: 'Command Center',
    to: '/',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'My Work',
    to: '/my-work',
    icon: Zap,
    exact: false,
  },
  {
    label: 'Investigations',
    to: '/investigations',
    icon: Search,
    exact: false,
  },
  {
    label: 'Knowledge',
    to: '/knowledge',
    icon: Layers,
    exact: false,
  },
  {
    label: 'Analytics',
    to: '/analytics',
    icon: FlaskConical,
    exact: false,
  },
]

const bottomNavItems = [
  {
    label: 'Administration',
    to: '/settings',
    icon: Settings,
  },
]

// ============================================================
// Sidebar Component
// ============================================================
interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const user = useCurrentUser()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#0F172A] border-r border-white/5',
        'transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/5',
        collapsed && 'justify-center'
      )}>
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600
                        flex items-center justify-center shadow-helix">
          <span className="text-sm font-black text-white tracking-tight">H</span>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-base font-bold gradient-text-helix">Helix</span>
            <span className="text-[10px] text-slate-500 ml-1.5 font-medium uppercase tracking-wider">
              EvidenceOps
            </span>
          </motion.div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                'text-[13px] font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <ChevronRight className="w-3 h-3 opacity-60" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* AI Provider Badge */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500/8 to-violet-500/8
                          border border-violet-500/15">
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                AI Runtime
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto animate-pulse" />
            </div>
            <p className="text-xs text-slate-300 font-medium">Fireworks AI</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Gemma 3 27B · AMD MI300X</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {/* User info (bottom) */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                            flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.full_name
                ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">
                {user.full_name ?? user.email}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
