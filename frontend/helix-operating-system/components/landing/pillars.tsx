import {
  Boxes,
  BrainCircuit,
  FileStack,
  Radar,
  Workflow,
} from 'lucide-react'

const pillars = [
  {
    icon: FileStack,
    name: 'Knowledge',
    line: 'Everything the organization knows.',
    body: 'SOPs, policies, equipment manuals, validation protocols, supplier documents, regulatory guidance, and historical CAPAs.',
  },
  {
    icon: Boxes,
    name: 'Memory',
    line: 'Everything Helix understands.',
    body: 'Never PDFs. Always canonical JSON — entities, relationships, metadata, chunks, and embeddings.',
  },
  {
    icon: Radar,
    name: 'Evidence',
    line: 'Everything happening today.',
    body: 'Deviations, complaints, batch failures, lab reports, audit findings, equipment logs, sensor events, and customer issues.',
  },
  {
    icon: BrainCircuit,
    name: 'Intelligence',
    line: 'The runtime.',
    body: 'Retrieves, reasons, compares, identifies gaps, finds contradictions, and generates evidence-backed assessments.',
  },
  {
    icon: Workflow,
    name: 'CAPA',
    line: 'Helix recommends. Humans approve.',
    body: 'Corrective and preventive actions proposed with full rationale, routed for human accountability and sign-off.',
  },
]

export function Pillars() {
  return (
    <section id="pillars" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-widest text-primary">
          The platform
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Five pillars, one continuous loop.
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Helix connects what your organization knows to what is happening now —
          and closes the loop with accountable action.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => (
          <div
            key={p.name}
            className="flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
              <p.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-0.5 text-sm text-primary/90">{p.line}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </div>
        ))}

        {/* balancing cell */}
        <div className="hidden bg-card p-7 lg:flex lg:flex-col lg:justify-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Knowledge → Memory → Evidence → Intelligence → CAPA →{' '}
            <span className="text-foreground">Learning</span>, then back again.
          </p>
        </div>
      </div>
    </section>
  )
}
