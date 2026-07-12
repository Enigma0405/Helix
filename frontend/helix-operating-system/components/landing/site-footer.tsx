import Link from 'next/link'
import { HelixMark } from '@/components/helix-mark'

const columns = [
  {
    heading: 'Platform',
    links: ['Knowledge', 'Memory', 'Evidence', 'Intelligence', 'CAPA'],
  },
  {
    heading: 'Company',
    links: ['About', 'Security', 'Careers', 'Contact'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'EvidenceOps', 'Changelog', 'Status'],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground"
            aria-label="Helix home"
          >
            <HelixMark className="h-6 w-6 text-primary" />
            <span className="text-[15px] font-semibold tracking-tight">
              Helix
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            EvidenceOps — enterprise intelligence for evidence-backed decisions.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {col.heading}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Helix. All rights reserved.</span>
          <span className="font-mono uppercase tracking-widest">
            Models observe · Systems decide · Humans remain accountable
          </span>
        </div>
      </div>
    </footer>
  )
}
