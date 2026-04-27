import { Check } from "lucide-react";
import { VARDAR_BENEFITS, VARDAR_HEADING, VARDAR_HOW } from "@/content/home";

export function VardarSection() {
  return (
    <section
      id="vardar"
      className="scroll-mt-20 border-t border-maak-border/60 bg-gradient-to-b from-maak-cream/40 to-maak-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-maak-primary shadow-sm">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-maak-coral"
              aria-hidden
            />
            {VARDAR_HEADING.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl lg:text-5xl">
            {VARDAR_HEADING.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-maak-muted-fg md:text-lg">
            {VARDAR_HEADING.subtitle}
          </p>
        </div>

        {/* ── Benefits grid ───────────────────────────────── */}
        <ul
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {VARDAR_BENEFITS.map((b) => (
            <li
              key={b.title}
              className="group flex flex-col rounded-2xl border border-maak-border/70 bg-white/85 p-6 shadow-[0_10px_36px_-32px_rgba(37,61,44,0.45)] transition hover:-translate-y-0.5 hover:border-maak-primary/45 hover:shadow-[0_18px_44px_-28px_rgba(37,61,44,0.4)]"
            >
              <div className="mb-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D9EDE4] ring-1 ring-maak-primary/15">
                <b.Icon
                  className="h-5 w-5 text-maak-primary"
                  strokeWidth={1.9}
                  aria-hidden
                />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-maak-foreground md:text-lg">
                {b.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-maak-muted-fg">
                {b.description}
              </p>
            </li>
          ))}
        </ul>

        {/* ── "Så blir du en Värd" ────────────────────────── */}
        <div className="mt-16 grid gap-10 rounded-3xl border border-maak-border/80 bg-white/80 p-6 shadow-[0_16px_44px_-34px_rgba(37,61,44,0.45)] md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maak-primary">
              {VARDAR_HOW.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-maak-foreground md:text-3xl">
              {VARDAR_HOW.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-maak-muted-fg md:text-base">
              {VARDAR_HOW.description}
            </p>
            <p className="mt-6 text-xs italic leading-relaxed text-maak-muted-fg">
              {VARDAR_HOW.footnote}
            </p>
          </div>
          <ul className="space-y-4" role="list">
            {VARDAR_HOW.criteria.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-2xl bg-maak-cream/60 px-5 py-4 ring-1 ring-maak-border/70"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maak-primary text-white"
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-maak-foreground md:text-base">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
