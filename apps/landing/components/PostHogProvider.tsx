"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * PostHog-initiering för landing-sidan — lazy laddad via dynamic import
 * så posthog-js (~170 KB) aldrig blockerar initial render.
 *
 * **Varför inte bara `posthog.init()` vid module load?**
 *   Det gör att posthog-js parses + evalueras på main thread under
 *   hydration, vilket på mobile-Lighthouse (4× CPU throttling) ger
 *   TBT 8+ sekunder. Vi flyttar det till `requestIdleCallback` med
 *   `setTimeout`-fallback, så main thread är fri för interaktion
 *   direkt och analytics laddas när browsern är ledig.
 *
 * Env (byggtid — Next inlinjerar `NEXT_PUBLIC_*` vid build):
 *   NEXT_PUBLIC_POSTHOG_KEY   – phc_... från EU-projektet
 *   NEXT_PUBLIC_POSTHOG_HOST  – https://eu.i.posthog.com (default)
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

// requestIdleCallback finns inte på Safari – fallback till setTimeout.
function onIdle(cb: () => void): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout?: number },
    ) => number;
  };
  if (w.requestIdleCallback) {
    w.requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 1);
  }
}

type InitStatus = "idle" | "loading" | "ready" | "skipped";

function LazyPostHogInitializer({
  onReady,
}: {
  onReady: (ph: { capture: (e: string, p?: Record<string, unknown>) => void }) => void;
}) {
  const [status, setStatus] = useState<InitStatus>("idle");

  useEffect(() => {
    if (status !== "idle") return;
    if (!POSTHOG_KEY) {
      setStatus("skipped");
      return;
    }
    setStatus("loading");

    onIdle(async () => {
      try {
        // Dynamic import → posthog-js hamnar i egen lazy chunk som
        // inte laddas under initial render. Next's chunker skapar
        // automatiskt en separat fil.
        const { default: posthog } = await import("posthog-js");
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          persistence: "localStorage+cookie",
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
          disable_session_recording: true,
          // Ingen loader-retry — sajten fungerar utan analytics
          loaded: (ph) => {
            // Exponera globalt så TrackedAppStoreLink kan nå den utan
            // att själv importera posthog-js.
            (window as unknown as { posthog: typeof ph }).posthog = ph;
            onReady(ph);
          },
        });
        setStatus("ready");
      } catch {
        setStatus("skipped");
      }
    });
  }, [status, onReady]);

  return null;
}

type PHClient = {
  capture: (event: string, props?: Record<string, unknown>) => void;
};

function PageViewTracker({ client }: { client: PHClient | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!client || !pathname) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    client.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PHClient | null>(null);

  // Provider wraps children direkt – ingen PHProvider från posthog-js/react
  // här, eftersom den skulle tvinga in biblioteket i initial bundle.
  return (
    <>
      <LazyPostHogInitializer onReady={setClient} />
      <Suspense fallback={null}>
        <PageViewTracker client={client} />
      </Suspense>
      {children}
    </>
  );
}
