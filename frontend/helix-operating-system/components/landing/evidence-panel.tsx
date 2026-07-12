import { ArrowDown, Check, CircleDot, Quote } from 'lucide-react'

const evidence = [
  {
    tag: 'DEVIATION',
    source: 'Batch B-2041 · Line 3',
    text: 'Fill weight exceeded upper action limit for 4 consecutive units.',
  },
  {
    tag: 'SOP',
    source: 'SOP-114 · Aseptic Fill §5.2',
    text: 'Action limit breach requires line hold and root-cause review.',
  },
  {
    tag: 'HISTORY',
    source: 'CAPA-0876 · resolved',
    text: 'Prior breach on Line 3 traced to load-cell calibration drift.',
  },
]

function StageLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-primary">{index}</span>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function EvidencePanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
      {/* window bar */}
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <CircleDot className="h-3.5 w-3.5 text-primary" />
          investigation / INV-2041 · fill-weight deviation
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
          Assessed
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        {/* Stage 1 — Evidence retrieved */}
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <StageLabel index="01" label="Evidence retrieved" />
          <ul className="mt-4 flex flex-col gap-3">
            {evidence.map((e, i) => (
              <li
                key={e.source}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground">
                    {e.tag}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    [{i + 1}]
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {e.text}
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  {e.source}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Stage 2 + 3 — Reasoning → Assessment */}
        <div className="flex flex-col p-5">
          <StageLabel index="02" label="Reasoning" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The deviation{' '}
            <span className="text-foreground">breaches the action limit</span>{' '}
            defined in SOP-114
            <sup className="text-primary">[2]</sup>. A resolved prior case
            <sup className="text-primary">[3]</sup> attributes the same failure
            mode to calibration drift.
          </p>

          <div className="my-4 flex items-center gap-2 text-muted-foreground">
            <ArrowDown className="h-4 w-4 text-primary" />
            <span className="h-px flex-1 bg-border" />
          </div>

          <StageLabel index="03" label="Assessment" />
          <p className="mt-4 text-pretty text-sm leading-relaxed text-foreground">
            Probable root cause: load-cell calibration drift on Line 3.
            Recommend line hold and calibration verification.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  Confidence
                </span>
                <span className="font-mono text-foreground">0.92</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[92%] rounded-full bg-primary" />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                <span className="text-foreground">Missing evidence:</span>{' '}
                latest calibration record for load cell LC-3 not yet ingested.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-[13px] text-foreground">
                CAPA recommended — awaiting human approval
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background/40 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Illustrative runtime trace · seeded demo data
      </div>
    </div>
  )
}
