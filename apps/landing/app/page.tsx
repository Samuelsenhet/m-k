import Image from "next/image";
import Link from "next/link";
import { Brain, Heart, Shield } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { IphoneMockup } from "@/components/IphoneMockup";

const features = [
  {
    title: "Matchning",
    description: "Ingen oändlig swipe – fokus på färre, mer meningsfulla kontakter.",
    imageSrc: "/screenshots/hero.png",
    imageAlt: "Skärmbild: matchning i määk",
  },
  {
    title: "Chatt",
    description: "Samtala i lugn takt när ni båda är redo.",
    imageSrc: "/screenshots/landing-profile-erik.png",
    imageAlt: "Skärmbild: chatt i määk",
  },
  {
    title: "Profiler",
    description: "Se hela personen – personlighet och preferenser i ett ögonkast.",
    imageSrc: "/screenshots/landing-profile-merbel.png",
    imageAlt: "Skärmbild: profil i määk",
  },
];

const stats = [
  { value: "500+", label: "Användare" },
  { value: "1 200+", label: "Matchningar" },
  { value: "85%", label: "Matchar första veckan" },
  { value: "3 000+", label: "Samtal startade" },
];

const NAV_LINKS = [
  { href: "#features", label: "Funktioner" },
  { href: "#stats", label: "Om appen" },
] as const;
const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/maak";

export default function HomePage() {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      {/* ── 1. Sticky header ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-maak-border/60 bg-maak-bg/85 shadow-[0_1px_0_0_rgba(37,61,44,0.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <a href="#top" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-maak-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-maak-coral" aria-hidden />
            määk
          </a>
          <nav className="flex items-center gap-6 text-sm text-maak-muted-fg">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hidden transition-colors hover:text-maak-primary sm:inline">
                {l.label}
              </a>
            ))}
            <Link href="/terms" className="hidden transition-colors hover:text-maak-primary sm:inline">
              Villkor
            </Link>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Ladda ner
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 2. Centrerad hero (MÄÄK) ───────────────── */}
        <section className="relative isolate overflow-hidden px-6 pb-20 pt-24 text-center md:pb-28 md:pt-32">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-maak-primary/8 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[8%] top-[20%] -z-10 h-36 w-36 rounded-full bg-maak-coral/10 blur-2xl"
          />
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white/85 px-3 py-1 text-xs font-medium text-maak-primary shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-maak-coral" aria-hidden />
              Ny på App Store
            </span>

            <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight text-maak-foreground md:text-5xl lg:text-6xl">
              Mänskligare dejtande börjar här.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-maak-muted-fg md:text-lg">
              määk hjälper dig hitta rätt personer i lugn takt. Färre svep, mer riktiga samtal och tryggare möten.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                Ladda ner määk
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white px-7 py-3.5 text-sm font-semibold text-maak-foreground shadow-sm transition hover:shadow-md"
              >
                Se funktioner
              </a>
            </div>

            <p className="mt-3 text-xs text-maak-muted-fg">Tillgänglig på iOS</p>

            {/* Appikon (light) → App Store — samma URL som övriga Ladda ner-länkar */}
            <div className="mt-10 flex w-full justify-center">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full max-w-[240px] flex-col items-center rounded-2xl border border-maak-border/60 bg-white/70 px-5 py-4 shadow-[0_12px_40px_-28px_rgba(37,61,44,0.35)] backdrop-blur-sm transition hover:border-maak-primary/45 hover:shadow-[0_16px_44px_-28px_rgba(37,61,44,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maak-primary sm:max-w-[260px]"
                aria-label="Ladda ner määk i App Store"
              >
                <Image
                  src="/app-icon-light.png"
                  alt=""
                  width={512}
                  height={512}
                  className="h-24 w-24 rounded-[1.35rem] object-contain object-center shadow-[0_4px_14px_rgba(37,61,44,0.12)] ring-1 ring-black/[0.06] transition group-hover:scale-[1.04] group-active:scale-[0.98] sm:h-28 sm:w-28 sm:rounded-[1.5rem]"
                  sizes="(max-width: 640px) 96px, 112px"
                />
                <span className="mt-2 text-xs font-semibold tracking-wide text-maak-primary">
                  Hämta i App Store
                </span>
              </a>
            </div>

            {/* Samma värderader som webb/mobil landing (Lucide Brain / Shield / Heart) */}
            <div
              className="mt-12 flex w-full max-w-md justify-center gap-4 px-1 sm:gap-6 md:max-w-lg"
              role="list"
              aria-label="Fördelar"
            >
              {(
                [
                  {
                    Icon: Brain,
                    title: "Personlighets-",
                    sub: "matchning",
                  },
                  {
                    Icon: Shield,
                    title: "Säker &",
                    sub: "verifierad",
                  },
                  {
                    Icon: Heart,
                    title: "Meningsfulla",
                    sub: "kopplingar",
                  },
                ] as const
              ).map((f, i) => (
                <div key={i} className="min-w-0 max-w-[120px] flex-1 text-center" role="listitem">
                  <div className="mx-auto mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D9EDE4]">
                    <f.Icon className="h-6 w-6 shrink-0 text-[#3D5A3B]" strokeWidth={1.75} aria-hidden />
                  </div>
                  <p className="text-xs font-medium leading-tight text-maak-primary">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-tight text-maak-muted-fg">{f.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <IphoneMockup src="/screenshots/hero.png" alt="määk i telefonen" />
            </div>
          </div>
        </section>

        {/* ── 3. Features ────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 border-t border-maak-border/60 bg-maak-cream/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
              Så fungerar det
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-maak-muted-fg">
              Passa &rarr; Chatta &rarr; Träffas
            </p>

            <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-maak-border to-transparent" aria-hidden />

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <FeatureCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Stats ───────────────────────────────────────── */}
        <section id="stats" className="scroll-mt-20 border-t border-maak-border/60 bg-maak-bg py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
              Riktiga möten.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-lg text-maak-muted-fg">
              En ny typ av dejtande tar form.
            </p>

            <div className="mt-10 rounded-3xl border border-maak-border/80 bg-white/80 p-4 shadow-[0_16px_44px_-34px_rgba(37,61,44,0.45)] md:p-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center rounded-2xl bg-maak-card/75 px-4 py-6 ring-1 ring-maak-border/80 transition hover:bg-maak-card"
                >
                  <span className="text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
                    {s.value}
                  </span>
                  <span className="mt-1 text-xs font-medium uppercase tracking-wider text-maak-muted-fg">
                    {s.label}
                  </span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. CTA ─────────────────────────────────────────── */}
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
                MÄÄK i App Store
              </p>
              <h2 className="relative mt-3 text-3xl font-bold tracking-tight text-maak-foreground md:text-5xl">
                Redo att träffa någon som passar dig?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-maak-muted-fg md:text-lg">
                Ladda ner määk och börja med lugnare, tryggare och mer mänskligt dejtande.
              </p>

              <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                >
                  Ladda ner määk
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white px-7 py-3.5 text-sm font-semibold text-maak-foreground shadow-sm transition hover:shadow-md"
                >
                  Utforska funktioner
                </a>
              </div>

              <p className="relative mt-4 text-xs text-maak-muted-fg">Tillgänglig på iOS</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── 6. Footer ──────────────────────────────────────── */}
      <footer className="border-t border-maak-border/60 bg-maak-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
          {/* Col 1 – Brand */}
          <div>
            <span className="text-xl font-bold tracking-tight text-maak-foreground">määk</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-maak-muted-fg">
              En lugn dejtingapp för riktiga samtal, mänskligare möten och tryggare tempo.
            </p>
          </div>

          {/* Col 2 – Support & rapporter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-maak-muted-fg">Support & rapporter</h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="text-maak-foreground transition hover:text-maak-primary">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-maak-foreground transition hover:text-maak-primary">
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link href="/reporting" className="text-maak-foreground transition hover:text-maak-primary">
                  Rapportering
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-maak-foreground transition hover:text-maak-primary">
                  Om MÄÄK
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 – Kontakt */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-maak-muted-fg">Kontakt</h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a href="mailto:hej@maakapp.se" className="text-maak-foreground transition hover:text-maak-primary">
                  hej@maakapp.se
                </a>
              </li>
              <li>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-maak-border px-4 py-1.5 text-xs font-semibold text-maak-foreground transition hover:bg-maak-cream"
                >
                  Ladda ner appen
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-maak-border/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-maak-muted-fg sm:flex-row sm:items-center sm:justify-between">
            <span>&copy; {new Date().getFullYear()} määk. Alla rättigheter reserverade.</span>
            <div className="flex gap-5">
              <Link href="/privacy" className="hover:text-maak-primary">
                Integritetspolicy
              </Link>
              <Link href="/terms" className="hover:text-maak-primary">
                Användarvillkor
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
