import Constants from "expo-constants";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NativeModules, Platform } from "react-native";
import { useSupabase } from "@/contexts/SupabaseProvider";

/** Entitlement IDs must match RevenueCat dashboard. */
export const BASIC_ENTITLEMENT_ID = "basic";
export const PREMIUM_ENTITLEMENT_ID = "premium";

function readRevenueCatKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") return fromEnv.trim();
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = extra.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  if (typeof fromExtra === "string" && fromExtra.trim() !== "") return fromExtra.trim();
  return "";
}

interface PurchasesContextValue {
  configured: boolean;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  hasBasic: boolean;
  hasPremium: boolean;
  hasPaid: boolean;
  loading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; cancelled: boolean; error?: Error }>;
  restorePurchases: () => Promise<{ success: boolean; error?: Error }>;
  refresh: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

/**
 * Wraps RevenueCat. iOS-only (bundleId: com.samuelsenhet.maak).
 * On Supabase session change we Purchases.logIn(userId) so webhooks can map receipts → user_id.
 * Source of truth for entitlement is Supabase `subscriptions` (read by useSubscription).
 * This provider exposes the client SDK for the purchase flow only.
 */
export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { session } = useSupabase();
  const userId = session?.user?.id ?? null;
  const configuredRef = useRef(false);

  const [configured, setConfigured] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure once per app lifetime. No-op when the native module is absent
  // (Expo Go, web, Android, or any env without a dev-client / standalone build).
  useEffect(() => {
    if (configuredRef.current) return;
    if (Platform.OS !== "ios" || !NativeModules.RNPurchases) {
      setLoading(false);
      return;
    }
    const apiKey = readRevenueCatKey();
    if (!apiKey) {
      if (__DEV__) console.warn("[PurchasesProvider] EXPO_PUBLIC_REVENUECAT_IOS_KEY not set");
      setLoading(false);
      return;
    }
    try {
      Purchases.configure({ apiKey });
      configuredRef.current = true;
      setConfigured(true);
    } catch (err) {
      if (__DEV__) console.error("[PurchasesProvider] configure failed:", err);
      setLoading(false);
    }
  }, []);

  // Identify / anonymise on auth changes.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        if (userId) {
          await Purchases.logIn(userId);
        } else {
          const isAnonymous = await Purchases.isAnonymous();
          if (!isAnonymous) {
            await Purchases.logOut();
          }
        }
      } catch (err) {
        if (__DEV__ && !cancelled) console.error("[PurchasesProvider] logIn/logOut:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, userId]);

  // Fetch offerings + customerInfo once configured, and whenever user changes.
  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const [offerings, info] = await Promise.all([
        Purchases.getOfferings(),
        Purchases.getCustomerInfo(),
      ]);
      setOffering(offerings.current ?? null);
      setCustomerInfo(info);
    } catch (err) {
      if (__DEV__) console.error("[PurchasesProvider] refresh:", err);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  // Subscribe to CustomerInfo updates pushed by the SDK.
  useEffect(() => {
    if (!configured) return;
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured]);

  const purchasePackage = useCallback<PurchasesContextValue["purchasePackage"]>(
    async (pkg) => {
      if (!configured) {
        return { success: false, cancelled: false, error: new Error("purchases_not_configured") };
      }
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(info);
        const active =
          !!info.entitlements.active[BASIC_ENTITLEMENT_ID] ||
          !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
        return { success: active, cancelled: false };
      } catch (err) {
        const e = err as { userCancelled?: boolean; message?: string };
        if (e?.userCancelled) return { success: false, cancelled: true };
        return {
          success: false,
          cancelled: false,
          error: err instanceof Error ? err : new Error(e?.message ?? "purchase_failed"),
        };
      }
    },
    [configured],
  );

  const restorePurchases = useCallback<PurchasesContextValue["restorePurchases"]>(async () => {
    if (!configured) {
      return { success: false, error: new Error("purchases_not_configured") };
    }
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const active =
        !!info.entitlements.active[BASIC_ENTITLEMENT_ID] ||
        !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
      return { success: active };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err : new Error("restore_failed") };
    }
  }, [configured]);

  const hasBasic = !!customerInfo?.entitlements.active[BASIC_ENTITLEMENT_ID];
  const hasPremium = !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  const hasPaid = hasBasic || hasPremium;

  const value = useMemo<PurchasesContextValue>(
    () => ({
      configured,
      offering,
      customerInfo,
      hasBasic,
      hasPremium,
      hasPaid,
      loading,
      purchasePackage,
      restorePurchases,
      refresh,
    }),
    [
      configured,
      offering,
      customerInfo,
      hasBasic,
      hasPremium,
      hasPaid,
      loading,
      purchasePackage,
      restorePurchases,
      refresh,
    ],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) {
    throw new Error("usePurchases must be used within PurchasesProvider");
  }
  return ctx;
}
