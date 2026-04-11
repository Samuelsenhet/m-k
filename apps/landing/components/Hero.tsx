import Image from "next/image";
import { HERO, HERO_VALUES } from "@/content/home";
import { IphoneMockup } from "./IphoneMockup";
import { TrackedAppStoreLink } from "./TrackedAppStoreLink";

export function Hero() {
  return (
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
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-maak-coral"
            aria-hidden
          />
          {HERO.eyebrow}
        </span>

        <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight text-maak-foreground md:text-5xl lg:text-6xl">
          {HERO.title}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-maak-muted-fg md:text-lg">
          {HERO.lead}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <TrackedAppStoreLink
            source="hero_primary"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            {HERO.primaryCta}
          </TrackedAppStoreLink>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white px-7 py-3.5 text-sm font-semibold text-maak-foreground shadow-sm transition hover:shadow-md"
          >
            {HERO.secondaryCta}
          </a>
        </div>

        <p className="mt-3 text-xs text-maak-muted-fg">{HERO.availability}</p>

        {/* App-ikon → App Store */}
        <div className="mt-10 flex w-full justify-center">
          <TrackedAppStoreLink
            source="hero_icon_tile"
            className="group flex w-full max-w-[240px] flex-col items-center rounded-2xl border border-maak-border/60 bg-white/70 px-5 py-4 shadow-[0_12px_40px_-28px_rgba(37,61,44,0.35)] backdrop-blur-sm transition hover:border-maak-primary/45 hover:shadow-[0_16px_44px_-28px_rgba(37,61,44,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maak-primary sm:max-w-[260px]"
            ariaLabel="Ladda ner määk i App Store"
          >
            {/* INGEN priority här — hero.webp ska vinna bandbredds-racet
                under initial paint så LCP landar på iPhone-mockupen */}
            <Image
              src="/app-icon-light.webp"
              alt=""
              width={224}
              height={224}
              loading="lazy"
              className="h-24 w-24 rounded-[1.35rem] object-contain object-center shadow-[0_4px_14px_rgba(37,61,44,0.12)] ring-1 ring-black/[0.06] transition group-hover:scale-[1.04] group-active:scale-[0.98] sm:h-28 sm:w-28 sm:rounded-[1.5rem]"
              sizes="(max-width: 640px) 96px, 112px"
            />
            <span className="mt-2 text-xs font-semibold tracking-wide text-maak-primary">
              {HERO.downloadLabel}
            </span>
          </TrackedAppStoreLink>
        </div>

        {/* Värderader */}
        <div
          className="mt-12 flex w-full max-w-md justify-center gap-4 px-1 sm:gap-6 md:max-w-lg"
          role="list"
          aria-label="Fördelar"
        >
          {HERO_VALUES.map((f) => (
            <div
              key={f.sub}
              className="min-w-0 max-w-[120px] flex-1 text-center"
              role="listitem"
            >
              <div className="mx-auto mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D9EDE4]">
                <f.Icon
                  className="h-6 w-6 shrink-0 text-[#3D5A3B]"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <p className="text-xs font-medium leading-tight text-maak-primary">
                {f.title}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-maak-muted-fg">
                {f.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <IphoneMockup src="/screenshots/hero.webp" alt="määk i telefonen" priority />
        </div>
      </div>
    </section>
  );
}
