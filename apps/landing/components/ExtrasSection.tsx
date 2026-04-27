import { EXTRAS, EXTRAS_HEADING } from "@/content/home";

export function ExtrasSection() {
  return (
    <section
      id="more"
      className="scroll-mt-20 border-t border-maak-border/60 bg-maak-bg py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maak-primary">
            {EXTRAS_HEADING.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
            {EXTRAS_HEADING.title}
          </h2>
          <p className="mt-3 text-maak-muted-fg">{EXTRAS_HEADING.subtitle}</p>
        </div>

        <ul
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {EXTRAS.map((f) => (
            <li
              key={f.title}
              className="group flex flex-col rounded-2xl border border-maak-border/70 bg-white/80 p-6 shadow-[0_10px_36px_-32px_rgba(37,61,44,0.45)] transition hover:-translate-y-0.5 hover:border-maak-primary/45 hover:shadow-[0_18px_44px_-28px_rgba(37,61,44,0.4)]"
            >
              <div className="mb-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D9EDE4] ring-1 ring-maak-primary/15">
                <f.Icon
                  className="h-5 w-5 text-maak-primary"
                  strokeWidth={1.9}
                  aria-hidden
                />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-maak-foreground md:text-lg">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-maak-muted-fg">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
