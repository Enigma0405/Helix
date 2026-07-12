import { Database, GitCompare, ScanSearch, Sparkles } from 'lucide-react'

const steps = [
  {
    icon: ScanSearch,
    step: '01',
    title: 'Retrieve',
    body: 'Helix pulls the exact knowledge and prior cases relevant to the evidence in front of it.',
  },
  {
    icon: GitCompare,
    step: '02',
    title: 'Reason & compare',
    body: 'It compares live evidence against canonical memory to surface gaps and contradictions.',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'Assess',
    body: 'It generates findings with per-statement confidence, explicit citations, and missing evidence.',
  },
  {
    icon: Database,
    step: '04',
    title: 'Recommend & learn',
    body: 'It proposes CAPA for human approval — and the resolution re-enters organizational memory.',
  },
]

export function Runtime() {
  return (
    <section
      id="runtime"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-primary">
            The runtime
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Evidence before AI. Always.
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Helix never shows &ldquo;AI thinking&rdquo;. It shows the evidence
            it retrieved, the reasoning it applied, and the confidence behind
            every conclusion — so nothing is hidden.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.step} className="flex flex-col gap-4 bg-card p-7">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.step}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
