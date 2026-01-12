import { createContext } from "react";

export interface ConsentPreferences {
  necessary: boolean;
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

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export { ConsentContext };
export type { ConsentContextType };
