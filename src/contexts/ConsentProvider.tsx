import { type ReactNode, useEffect, useState } from "react";

import { ConsentContext, type ConsentContextType, type ConsentPreferences } from "@/contexts/ConsentContext";

type ConsentProviderProps = {
  children: ReactNode;
};

const CONSENT_VERSION = "1.0.0";
const CONSENT_STORAGE_KEY = "maak_gdpr_consent";

const defaultConsent: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
  acceptedAt: null,
  version: CONSENT_VERSION,
};

const ConsentProvider = ({ children }: ConsentProviderProps) => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConsentPreferences;
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to parse consent preferences:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const saveConsent = (preferences: ConsentPreferences) => {
    const withTimestamp = {
      ...preferences,
      acceptedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    } satisfies ConsentPreferences;
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(withTimestamp));
    setConsent(withTimestamp);
  };

  const acceptAll: ConsentContextType["acceptAll"] = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      acceptedAt: null,
      version: CONSENT_VERSION,
    });
  };

  const rejectAll: ConsentContextType["rejectAll"] = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      acceptedAt: null,
      version: CONSENT_VERSION,
    });
  };

  const updateConsent: ConsentContextType["updateConsent"] = (preferences) => {
    const updated = {
      ...defaultConsent,
      ...consent,
      ...preferences,
      necessary: true,
    } satisfies ConsentPreferences;
    saveConsent(updated);
  };

  const resetConsent: ConsentContextType["resetConsent"] = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent(null);
  };

  const hasConsented = consent !== null && consent.acceptedAt !== null;

  const value: ConsentContextType = {
    consent,
    hasConsented,
    isLoading,
    acceptAll,
    rejectAll,
    updateConsent,
    resetConsent,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export { ConsentProvider };
