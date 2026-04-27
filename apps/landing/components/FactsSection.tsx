import { FACTS, FACTS_HEADING } from "@/content/home";

export function FactsSection() {
  return (
    <section
      id="stats"
      className="scroll-mt-20 border-t border-maak-border/60 bg-maak-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
          {FACTS_HEADING.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-lg text-maak-muted-fg">
          {FACTS_HEADING.subtitle}
        </p>

        <div className="mt-10 rounded-3xl border border-maak-border/80 bg-white/80 p-4 shadow-[0_16px_44px_-34px_rgba(37,61,44,0.45)] md:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {FACTS.map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center rounded-2xl bg-maak-card/75 px-4 py-6 ring-1 ring-maak-border/80 transition hover:bg-maak-card"
              >
                <span className="text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
                  {f.value}
                </span>
                <span className="mt-1 text-xs font-medium uppercase tracking-wider text-maak-muted-fg">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
