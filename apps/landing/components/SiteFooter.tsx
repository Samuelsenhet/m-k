import Link from "next/link";
import { FOOTER, SITE } from "@/content/home";

export function SiteFooter() {
  return (
    <footer className="border-t border-maak-border/60 bg-maak-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
        {/* Col 1 – Brand */}
        <div>
          <span className="text-xl font-bold tracking-tight text-maak-foreground">
            {SITE.name}
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-maak-muted-fg">
            {FOOTER.tagline}
          </p>
        </div>

        {/* Col 2 – Support */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-maak-muted-fg">
            {FOOTER.supportHeading}
          </h4>
          <ul className="mt-3 space-y-2.5 text-sm">
            {FOOTER.supportLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-maak-foreground transition hover:text-maak-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 – Kontakt */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-maak-muted-fg">
            {FOOTER.contactHeading}
          </h4>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="text-maak-foreground transition hover:text-maak-primary"
              >
                {SITE.contactEmail}
              </a>
            </li>
            <li>
              <a
                href={SITE.appStoreUrl}
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
          <span>
            &copy; {new Date().getFullYear()} {SITE.name}. Alla rättigheter reserverade.
          </span>
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
  );
}
