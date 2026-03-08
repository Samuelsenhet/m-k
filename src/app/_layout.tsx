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
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ConsentProvider } from "@/contexts/ConsentProvider";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { Platform } from "react-native";

const queryClient = new QueryClient();

/** Only load Vercel scripts in browser; skip in Capacitor/native WebView to avoid 404s. */
const isVercelEnabled =
  typeof window !== "undefined" && !(window as { Capacitor?: unknown }).Capacitor;

/** HelmetProvider is web-only; skip in Expo Go / React Native to avoid document errors. */
const WrapWithHelmet = ({ children }: { children: React.ReactNode }) =>
  Platform.OS === "web" ? <HelmetProvider>{children}</HelmetProvider> : <>{children}</>;

export default function RootLayout() {
  return (
    <WrapWithHelmet>
      <QueryClientProvider client={queryClient}>
        <ConsentProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {isVercelEnabled && (
                <>
                  <SpeedInsights />
                  <Analytics />
                </>
              )}
              <Stack />
            </TooltipProvider>
          </AuthProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </WrapWithHelmet>
  );
}
