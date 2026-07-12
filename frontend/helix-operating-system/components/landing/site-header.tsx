import Link from 'next/link'
import { HelixMark } from '@/components/helix-mark'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Platform', href: '#platform' },
  { label: 'EvidenceOps', href: '#philosophy' },
  { label: 'How it works', href: '#runtime' },
  { label: 'Pillars', href: '#pillars' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground"
          aria-label="Helix home"
        >
          <HelixMark className="h-6 w-6 text-primary" />
          <span className="text-[15px] font-semibold tracking-tight">
            Helix
          </span>
          <span className="ml-1 hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            EvidenceOps
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
            render={<Link href="/login">Sign in</Link>}
          />
          <Button
            nativeButton={false}
            className="font-medium"
            render={<Link href="/request-access">Request access</Link>}
          />
        </div>
      </div>
    </header>
  )
}
