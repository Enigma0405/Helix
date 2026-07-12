const lines = [
  { k: 'Models', v: 'observe' },
  { k: 'Systems', v: 'decide' },
  { k: 'Humans', v: 'remain accountable' },
]

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Core philosophy
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-px overflow-hidden rounded-xl border border-border md:flex-row">
          {lines.map((line) => (
            <div
              key={line.k}
              className="flex-1 bg-card px-8 py-10 text-center"
            >
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {line.k}
              </div>
              <div className="mt-1 text-lg text-muted-foreground">
                {line.v}
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-balance text-center leading-relaxed text-muted-foreground">
          The AI never replaces the human. It explains, it cites evidence, and
          it shows its confidence. The human approves.
        </p>
      </div>
    </section>
  )
}
