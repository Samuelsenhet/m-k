import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om määk",
  description:
    "määk är en lugn dejtingapp som sätter personlighet och trygghet främst. Läs om visionen, teamet och varför vi bygger en annorlunda dejtingupplevelse.",
  alternates: { canonical: "/about/" },
  openGraph: {
    title: "Om määk",
    description: "Visionen bakom en mänskligare dejtingapp.",
    url: "/about/",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-maak-bg pb-20">
      <div className="sticky top-0 z-10 border-b border-maak-border/70 bg-maak-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0 text-sm font-medium text-maak-primary hover:underline">
            ← Tillbaka
          </Link>
          <h1 className="truncate text-base font-semibold tracking-tight text-maak-foreground">
            Om MÄÄK
          </h1>
          <span className="w-[62px]" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
        <p className="text-sm text-maak-muted-fg">Senast uppdaterad: 2026-03-31</p>

        <div className="rounded-3xl border border-maak-border bg-maak-card p-5 transition-all duration-200 shadow-[0_10px_28px_-24px_rgba(37,61,44,0.5)]">
          <section className="space-y-3 text-sm leading-relaxed text-maak-muted-fg">
            <h2 className="text-base font-semibold text-maak-foreground">Om MÄÄK</h2>
            <p>
              MÄÄK är Sveriges smartaste dejtingapp med AI-driven personlighetsmatchning. Vi hjälper
              singlar att hitta någon som verkligen passar utifrån personlighet, värderingar och
              kommunikation.
            </p>
            <p>
              Ta vårt 30-frågor personlighetstest, få dagliga matchningar och starta meningsfulla
              konversationer med isbrytare som passar dig.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
