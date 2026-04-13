"use client";

import { useEffect, useState } from "react";
import { CookieBanner } from "./CookieBanner";
import { PostHogScript } from "./PostHogScript";

const STORAGE_KEY = "maak-cookie-consent";
type Decision = "accepted" | "rejected" | null;

export function ConsentGate() {
  const [decision, setDecision] = useState<Decision>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "rejected") {
        setDecision(stored);
      }
    } catch {
      /* SSR / private-mode fallback: leave decision null so banner renders */
    }
    setMounted(true);
  }, []);

  const persist = (next: Exclude<Decision, null>) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore — state still updates in-memory for the session */
    }
    setDecision(next);
  };

  // Avoid rendering the banner pre-hydration to prevent hydration mismatch;
  // the PostHog script will also only mount client-side after consent.
  if (!mounted) return null;

  return (
    <>
      {decision === "accepted" ? <PostHogScript /> : null}
      {decision === null ? (
        <CookieBanner
          onAccept={() => persist("accepted")}
          onReject={() => persist("rejected")}
        />
      ) : null}
    </>
  );
}
