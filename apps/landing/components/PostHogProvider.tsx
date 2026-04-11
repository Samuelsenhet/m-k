"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  PostHogProvider as PHProvider,
  usePostHog,
} from "posthog-js/react";
import { Suspense, useEffect } from "react";
import posthog from "posthog-js";

/**
 * PostHog-initiering för landing-sidan. Körs på klienten eftersom posthog-js
 * rör `window`. Initieras en gång och wrap:ar hela appen i providern.
 *
 * Env (byggtid — Next inlinjerar `NEXT_PUBLIC_*` vid build):
 *   NEXT_PUBLIC_POSTHOG_KEY   – phc_... från EU-projektet
 *   NEXT_PUBLIC_POSTHOG_HOST  – https://eu.i.posthog.com (default om otom)
 *
 * Saknas nyckeln körs en no-op – vi kraschar inte dev eller preview-bygg.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Ingen cookie-banner behövs: PostHog EU default är cookieless
    // (använder localStorage + memory). Sätter det explicit.
    persistence: "localStorage+cookie",
    // Pageview capturing hanterar vi själva nedan för att få rätt path
    // från App Router (posthog-js default räknar bara initiala loads).
    capture_pageview: false,
    // App Router emitter pageleaves automatiskt när vi byter route.
    capture_pageleave: true,
    // Ingen autocapture på landing – vi äger eventen manuellt för att
    // hålla listan ren. Går att slå på senare om vi vill ha klickdata.
    autocapture: false,
    // EU-host kräver inga extra flaggor men vi dokumenterar det här.
    disable_session_recording: true,
  });
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !pathname) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Om nyckeln saknas → render ren children. Ingen provider, inga events.
  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      {/* useSearchParams måste vara inne i Suspense enligt Next 15 */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
