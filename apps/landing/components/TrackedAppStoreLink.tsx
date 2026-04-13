import type { ReactNode } from "react";

type Source =
  | "header"
  | "hero_primary"
  | "hero_icon_tile"
  | "cta_primary"
  | "footer";

type Props = {
  source: Source;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/**
 * Server component - renderar en vanlig `<a>` med `data-track-source`.
 *
 * Pre-launch: alla "Ladda ner"-CTA:er pekar på /vanta/-väntelistan
 * istället för App Store. När MÄÄK är live i App Store: byt href
 * tillbaka till SITE.appStoreUrl, lägg tillbaka target="_blank" och
 * rel="noopener noreferrer", och importera SITE igen från @/content/home.
 *
 * Click-tracking sker via en enda document-level listener i
 * PostHogScript, inte via en React onClick per länk. Det betyder:
 *   - Ingen client boundary per länk → sparar hydration-tid
 *   - `posthog-js` stannar i sin lazy-chunk, pullas inte in via
 *     user-hook-grafen
 *   - Alla fem CTA:er (header/hero/cta/footer/icon) är fortfarande
 *     bara en länk i HTML:en - ingen behöver hydreras
 *   - Event-namnet `landing_app_store_click` speglar fortfarande
 *     CTA:ns intent (download-knappen), oavsett destination.
 */
export function TrackedAppStoreLink({
  source,
  children,
  className,
  ariaLabel,
}: Props) {
  return (
    <a
      href="/vanta/"
      className={className}
      aria-label={ariaLabel}
      data-track-source={source}
    >
      {children}
    </a>
  );
}
