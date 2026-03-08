import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ConsentProvider } from "@/contexts/ConsentProvider";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { router } from "@/routes";

const queryClient = new QueryClient();

/** Only load Vercel scripts in browser; skip in Capacitor/native WebView to avoid 404s. */
const isVercelEnabled =
  typeof window !== "undefined" && !(window as { Capacitor?: unknown }).Capacitor;

const App = () => (
  <HelmetProvider>
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
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthProvider>
      </ConsentProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
