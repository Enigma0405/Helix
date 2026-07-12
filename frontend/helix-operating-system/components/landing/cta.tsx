import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section id="platform" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-16 text-center md:px-16 md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 4%) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Stop deciding on assumptions.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Give your quality and operations teams an intelligence layer that
            connects every document, investigation, and event — with evidence
            they can trust.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
              className="h-11 border-border bg-transparent px-6 font-medium hover:bg-accent"
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
