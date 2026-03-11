/**
 * Expo Router root layout.
 * Handles providers, auth state, and redirects between (auth) and (tabs) groups.
 */
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ConsentProvider } from "@/contexts/ConsentProvider";
import { useAuth } from "@/contexts/useAuth";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4b6e48" />
      </View>
    );
  }

  return <>{children}</>;
}

function WebOnlyProviders({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;
  try {
    const { HelmetProvider } = require("react-helmet-async");
    return <HelmetProvider>{children}</HelmetProvider>;
  } catch {
    return <>{children}</>;
  }
}

export default function RootLayout() {
  return (
    <WebOnlyProviders>
      <QueryClientProvider client={queryClient}>
        <ConsentProvider>
          <AuthProvider>
            <AuthGuard>
              <Slot />
            </AuthGuard>
          </AuthProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </WebOnlyProviders>
  );
}
