import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createMaakSupabaseClient,
  parseMaakSupabaseEnv,
  resolveProfilesAuthKey,
  type MaakAuthStorage,
} from "@maak/core";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { posthog } from "@/lib/posthog";

const storageAdapter: MaakAuthStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value).then(() => {}),
  removeItem: (key) => SecureStore.deleteItemAsync(key).then(() => {}),
};

function readBuildEnv(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}

function readExpoExtraEnv(): Record<string, string | undefined> {
  const constantsWithManifest = Constants as typeof Constants & {
    manifest?: { extra?: Record<string, unknown> };
    manifest2?: { extra?: Record<string, unknown> };
  };
  const extra = (
    Constants.expoConfig?.extra ??
    constantsWithManifest.manifest2?.extra ??
    constantsWithManifest.manifest?.extra ??
    {}
  ) as Record<string, unknown>;
  return {
    EXPO_PUBLIC_SUPABASE_URL:
      typeof extra.EXPO_PUBLIC_SUPABASE_URL === "string"
        ? extra.EXPO_PUBLIC_SUPABASE_URL
        : undefined,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      typeof extra.EXPO_PUBLIC_SUPABASE_ANON_KEY === "string"
        ? extra.EXPO_PUBLIC_SUPABASE_ANON_KEY
        : undefined,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      typeof extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "string"
        ? extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        : undefined,
    EXPO_PUBLIC_SUPABASE_PROJECT_ID:
      typeof extra.EXPO_PUBLIC_SUPABASE_PROJECT_ID === "string"
        ? extra.EXPO_PUBLIC_SUPABASE_PROJECT_ID
        : undefined,
    EXPO_PUBLIC_SUPABASE_RUNTIME_URL:
      typeof extra.runtimeSupabaseUrl === "string"
        ? extra.runtimeSupabaseUrl
        : undefined,
    EXPO_PUBLIC_SUPABASE_RUNTIME_ANON_KEY:
      typeof extra.runtimeSupabaseAnonKey === "string"
        ? extra.runtimeSupabaseAnonKey
        : undefined,
  };
}

function readSupabaseEnvForRuntime(): Record<string, string | undefined> {
  const buildEnv = readBuildEnv();
  const extraEnv = readExpoExtraEnv();

  // Expo only guarantees EXPO_PUBLIC_* in JS runtime. Read them explicitly so Metro can inline.
  const explicitPublicUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const explicitPublicAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const explicitPublicProjectId = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID;
  const explicitPublicPublishable = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    ...buildEnv,
    EXPO_PUBLIC_SUPABASE_URL:
      explicitPublicUrl ??
      buildEnv.EXPO_PUBLIC_SUPABASE_URL ??
      extraEnv.EXPO_PUBLIC_SUPABASE_URL ??
      extraEnv.EXPO_PUBLIC_SUPABASE_RUNTIME_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      explicitPublicAnon ??
      buildEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      extraEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      explicitPublicPublishable ??
      extraEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      extraEnv.EXPO_PUBLIC_SUPABASE_RUNTIME_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_PROJECT_ID:
      explicitPublicProjectId ??
      buildEnv.EXPO_PUBLIC_SUPABASE_PROJECT_ID ??
      extraEnv.EXPO_PUBLIC_SUPABASE_PROJECT_ID,
  };
}

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  isReady: boolean;
  hasValidSupabaseConfig: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const env = useMemo(() => parseMaakSupabaseEnv(readSupabaseEnvForRuntime()), []);

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

  // Honor the user's analytics_opt_out preference across app launches.
  // Without this, PostHog's local opt-state would reset on reinstall.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const key = await resolveProfilesAuthKey(supabase, userId);
        const { data } = await supabase
          .from("profiles")
          .select("analytics_opt_out")
          .eq(key, userId)
          .maybeSingle();
        if (cancelled) return;
        if (data?.analytics_opt_out) posthog.optOut();
        else posthog.optIn();
      } catch {
        /* default to opt-in on error; user can still toggle from Delad data */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, session?.user?.id]);

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
