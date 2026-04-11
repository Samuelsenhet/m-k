import type { ReactNode } from "react";
import { SITE } from "@/content/home";

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
 * Server component — renderar en vanlig `<a>` med `data-track-source`.
 *
 * Click-tracking sker via en enda document-level listener i
 * PostHogProvider, inte via en React onClick per länk. Det betyder:
 *   - Ingen client boundary per länk → sparar hydration-tid
 *   - `posthog-js` stannar i sin lazy-chunk, pullas inte in via
 *     user-hook-grafen
 *   - Alla fem CTA:er (header/hero/cta/footer/icon) är fortfarande
 *     bara en länk i HTML:en – ingen behöver hydreras
 */
export function TrackedAppStoreLink({
  source,
  children,
  className,
  ariaLabel,
}: Props) {
  return (
    <a
      href={SITE.appStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      data-track-source={source}
    >
      {children}
    </a>
  );
}
