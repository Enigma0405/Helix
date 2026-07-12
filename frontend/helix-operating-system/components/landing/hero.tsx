import Link from 'next/link'
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EvidencePanel } from '@/components/landing/evidence-panel'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* faint structural grid — calm, not decorative filler */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 4%) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-16 md:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            A new category — EvidenceOps
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Turn organizational knowledge into operational intelligence.
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Helix continuously converts your SOPs, policies, and operational
            evidence into assessments, recommendations, and corrective actions —
            every statement backed by evidence a human can trace and approve.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              className="h-11 px-6 font-medium"
              render={<Link href="/request-access" />}
            >
              Request access
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="h-11 border-border bg-transparent px-6 font-medium hover:bg-card"
              render={<Link href="#runtime" />}
            >
              See the runtime
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Built for regulated enterprises
            </span>
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Every answer cites its source
            </span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <EvidencePanel />
        </div>
      </div>
    </section>
  )
}
