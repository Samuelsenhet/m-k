/**
 * Expo Router root layout (replaces App.tsx when using Expo Router entry).
 * Renders before any other route; put font loading, theme providers, splash here.
 * See docs/expo-router-core-concepts.md.
 */
import { Stack } from "expo-router";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ConsentProvider } from "@/contexts/ConsentProvider";
import { Platform } from "react-native";

const queryClient = new QueryClient();

/** Only load Vercel scripts in browser; skip in Capacitor/native WebView to avoid 404s. */
const isVercelEnabled =
  typeof window !== "undefined" && !(window as { Capacitor?: unknown }).Capacitor;

/** Web-only providers: loaded lazily so Metro web bundling doesn't fail on optional deps. */
function WebOnlyProviders({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;
  try {
    const { HelmetProvider } = require("react-helmet-async");
    const { SpeedInsights } = require("@vercel/speed-insights/react");
    const { Analytics } = require("@vercel/analytics/react");
    return (
      <HelmetProvider>
        {children}
        {isVercelEnabled && (
          <>
            <SpeedInsights />
            <Analytics />
          </>
        )}
      </HelmetProvider>
    );
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
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Stack />
            </TooltipProvider>
          </AuthProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </WebOnlyProviders>
  );
}
