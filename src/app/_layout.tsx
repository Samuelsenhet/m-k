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

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ConsentProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SpeedInsights />
              <Analytics />
              <Stack />
            </TooltipProvider>
          </AuthProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
