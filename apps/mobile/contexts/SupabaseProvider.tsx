import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createMaakSupabaseClient,
  parseMaakSupabaseEnv,
  type MaakAuthStorage,
} from "@maak/core";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const storageAdapter: MaakAuthStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

function readBuildEnv(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  isReady: boolean;
  hasValidSupabaseConfig: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const env = useMemo(() => parseMaakSupabaseEnv(readBuildEnv()), []);

  const supabase = useMemo(() => {
    const url = env.isValid ? env.url : "https://placeholder.supabase.co";
    const anonKey = env.isValid
      ? env.anonKey
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
    return createMaakSupabaseClient({
      url,
      anonKey,
      storage: storageAdapter,
    });
  }, [env.isValid, env.url, env.anonKey]);

  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session ?? null);
        setIsReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      isReady,
      hasValidSupabaseConfig: env.isValid,
    }),
    [supabase, session, isReady, env.isValid],
  );

  return (
    <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
}
