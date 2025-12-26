import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ConsentPreferences {
  necessary: boolean; // Always true, required for app to function
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  acceptedAt: string | null;
  version: string;
}

interface ConsentContextType {
  consent: ConsentPreferences | null;
  hasConsented: boolean;
  isLoading: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (preferences: Partial<ConsentPreferences>) => void;
  resetConsent: () => void;
}

const CONSENT_VERSION = '1.0.0';
const CONSENT_STORAGE_KEY = 'maak_gdpr_consent';

const defaultConsent: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
  acceptedAt: null,
  version: CONSENT_VERSION,
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConsentPreferences;
        // Check if consent version matches, if not, require re-consent
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed);
        }
      } catch (e) {
        console.error('Failed to parse consent preferences:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveConsent = (preferences: ConsentPreferences) => {
    const withTimestamp = {
      ...preferences,
      acceptedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(withTimestamp));
    setConsent(withTimestamp);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      acceptedAt: null,
      version: CONSENT_VERSION,
    });
  };

  const rejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      acceptedAt: null,
      version: CONSENT_VERSION,
    });
  };

  const updateConsent = (preferences: Partial<ConsentPreferences>) => {
    const updated = {
      ...defaultConsent,
      ...consent,
      ...preferences,
      necessary: true, // Always required
    };
    saveConsent(updated);
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent(null);
  };

  const hasConsented = consent !== null && consent.acceptedAt !== null;

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasConsented,
        isLoading,
        acceptAll,
        rejectAll,
        updateConsent,
        resetConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
