import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/content/home";

export const metadata: Metadata = {
  title: "Sidan finns inte",
  description: "Länken verkar vara bruten eller sidan har flyttat.",
  robots: { index: false, follow: false },
};

// Next bygger denna till out/404.html vid static export. .htaccess har
// `ErrorDocument 404 /404.html` så Apache serverar den för alla 404:or.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-maak-bg px-6 py-24 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white/85 px-3 py-1 text-xs font-medium text-maak-primary shadow-sm">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-maak-coral"
            aria-hidden
          />
          404 · Sidan finns inte
        </span>

        <h1 className="mt-8 text-5xl font-bold leading-[1.05] tracking-tight text-maak-foreground md:text-6xl">
          Den här sidan
          <br />
          hittade vi inte.
        </h1>

        <p className="mt-5 max-w-sm text-base leading-relaxed text-maak-muted-fg">
          Länken är trasig, sidan har flyttat, eller så existerar den inte
          längre. Det är inte ditt fel.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Till startsidan
          </Link>
          <a
            href={SITE.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-maak-border bg-white px-7 py-3.5 text-sm font-semibold text-maak-foreground shadow-sm transition hover:shadow-md"
          >
            Hämta appen
          </a>
        </div>

        <p className="mt-8 text-xs text-maak-muted-fg">
          Hittade du en trasig länk?{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="underline underline-offset-4 hover:text-maak-primary"
          >
            Säg till
          </a>
          .
        </p>
      </div>
    </main>
  );
}
