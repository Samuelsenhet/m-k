"use client";

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
 * Wrapper runt alla App Store-CTA:er på landing. Fångar PostHog-eventet
 * `landing_app_store_click` med `source` så vi kan se vilken knapp som
 * driver flest klick.
 *
 * **Varför inte usePostHog()?** Hooken pullar in hela posthog-js i route-
 * chunken vid build, vilket ökar First Load JS med ~60 KB. Vi vill att
 * posthog-js stannar i sin egna lazy-chunk från providern. Istället
 * använder vi `window.posthog` som providern exponerar globalt efter
 * initiering.
 */

type PostHogGlobal = {
  capture: (event: string, props?: Record<string, unknown>) => void;
};

function captureClick(source: Source) {
  if (typeof window === "undefined") return;
  const ph = (window as unknown as { posthog?: PostHogGlobal }).posthog;
  if (ph && typeof ph.capture === "function") {
    ph.capture("landing_app_store_click", { source });
  }
  // Om PostHog inte hunnit init än (sällsynt) → tyst no-op.
  // Klicket går fortfarande vidare till App Store.
}

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
      onClick={() => captureClick(source)}
    >
      {children}
    </a>
  );
}
