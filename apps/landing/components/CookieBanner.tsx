"use client";

import Link from "next/link";

type Props = {
  onAccept: () => void;
  onReject: () => void;
};

export function CookieBanner({ onAccept, onReject }: Props) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Samtycke till kakor"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-maak-border bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <p className="flex-1 text-sm leading-relaxed text-maak-foreground">
          Vi använder <strong>PostHog</strong> för anonym produktanalys så vi kan
          förstå hur MÄÄK används och förbättra tjänsten. Ingen personligt
          identifierbar information samlas in.{" "}
          <Link
            href="/privacy/"
            className="underline underline-offset-2 hover:text-maak-primary"
          >
            Läs mer i integritetspolicyn
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 gap-3">
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-maak-border bg-white px-5 py-2.5 text-sm font-semibold text-maak-foreground transition hover:bg-maak-cream"
          >
            Avvisa
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Acceptera
          </button>
        </div>
      </div>
    </div>
  );
}
