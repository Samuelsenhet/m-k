import Link from "next/link";
import { NAV_LINKS, SITE } from "@/content/home";
import { TrackedAppStoreLink } from "./TrackedAppStoreLink";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-maak-border/60 bg-maak-bg/85 shadow-[0_1px_0_0_rgba(37,61,44,0.04)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a
          href="#top"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-maak-foreground"
        >
          <span
            className="inline-block h-2 w-2 rounded-full bg-maak-coral"
            aria-hidden
          />
          {SITE.name}
        </a>
        <nav className="flex items-center gap-6 text-sm text-maak-muted-fg">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hidden transition-colors hover:text-maak-primary sm:inline"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/terms"
            className="hidden transition-colors hover:text-maak-primary sm:inline"
          >
            Villkor
          </Link>
          <TrackedAppStoreLink
            source="header"
            className="rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Ladda ner
          </TrackedAppStoreLink>
        </nav>
      </div>
    </header>
  );
}
