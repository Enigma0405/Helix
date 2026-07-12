import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { Philosophy } from '@/components/landing/philosophy'
import { Pillars } from '@/components/landing/pillars'
import { Runtime } from '@/components/landing/runtime'
import { CtaSection } from '@/components/landing/cta'
import { SiteFooter } from '@/components/landing/site-footer'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Philosophy />
        <Pillars />
        <Runtime />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
