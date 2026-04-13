import Image from "next/image";
import Link from "next/link";

export function WaitlistBanner() {
  return (
    <section className="border-t border-maak-border/60 bg-maak-cream/40 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-maak-border/80 bg-gradient-to-b from-white to-maak-card px-6 py-10 text-center shadow-[0_28px_60px_-46px_rgba(37,61,44,0.5)] md:px-10 md:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-36 w-72 -translate-x-1/2 rounded-full bg-maak-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 bottom-2 h-24 w-24 rounded-full bg-maak-coral/10 blur-2xl"
          />

          <div className="relative flex flex-col items-center gap-5">
            <Image
              src="/mascot-vanta.webp"
              alt="MÄÄK mascot"
              width={100}
              height={100}
              className="drop-shadow-md"
            />

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-maak-foreground md:text-3xl">
                Gå med i väntelistan
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-maak-muted-fg">
                Vi lanserar snart. Var bland de första att testa MÄÄK - skriv
                upp dig så hör vi av oss på lanseringsdagen.
              </p>
            </div>

            <Link
              href="/vanta/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Ställ dig i kön
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
