import { CTA, SITE } from "@/content/home";

export function CtaSection() {
  return (
    <section className="border-t border-maak-border/60 bg-maak-cream/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-maak-border/80 bg-gradient-to-b from-white to-maak-card px-6 py-14 text-center shadow-[0_28px_60px_-46px_rgba(37,61,44,0.5)] md:px-10 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-36 w-72 -translate-x-1/2 rounded-full bg-maak-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 bottom-2 h-24 w-24 rounded-full bg-maak-coral/10 blur-2xl"
          />

          <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-maak-muted-fg">
            {CTA.eyebrow}
          </p>
          <h2 className="relative mt-3 text-3xl font-bold tracking-tight text-maak-foreground md:text-5xl">
            {CTA.title}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-maak-muted-fg md:text-lg">
            {CTA.body}
          </p>

          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={SITE.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              {CTA.primary}
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white px-7 py-3.5 text-sm font-semibold text-maak-foreground shadow-sm transition hover:shadow-md"
            >
              {CTA.secondary}
            </a>
          </div>

          <p className="relative mt-4 text-xs text-maak-muted-fg">
            {CTA.availability}
          </p>
        </div>
      </div>
    </section>
  );
}
