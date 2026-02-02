import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { AchievementsProvider } from "@/contexts/AchievementsContext";
import { ConsentProvider } from "@/contexts/ConsentProvider";
import { useConsent } from "@/contexts/useConsent";
import { GdprOnboarding } from "@/components/onboarding/GdprOnboarding";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import PhoneAuth from "./pages/PhoneAuth";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import ViewMatchProfile from "./pages/ViewMatchProfile";
import PersonalityGuide from "./pages/PersonalityGuide";
import Terms from "./pages/Terms";
import Reporting from "./pages/Reporting";
import Report from "./pages/Report";
import ReportHistory from "./pages/ReportHistory";
import AdminReports from "./pages/AdminReports";
import Appeal from "./pages/Appeal";
import DemoSeed from "./pages/DemoSeed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { hasConsented, isLoading } = useConsent();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {!hasConsented && <GdprOnboarding />}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/phone-auth" element={<PhoneAuth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/match/:userId" element={<ViewMatchProfile />} />
          <Route path="/view-match" element={<ViewMatchProfile />} />
          <Route path="/demo-seed" element={<DemoSeed />} />
          <Route path="/personality-guide" element={<PersonalityGuide />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Terms />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/report" element={<Report />} />
          <Route path="/report-history" element={<ReportHistory />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/appeal" element={<Appeal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <AuthProvider>
          <AchievementsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {import.meta.env.PROD && (
                <>
                  <SpeedInsights />
                  <Analytics />
                </>
              )}
              <AppContent />
            </TooltipProvider>
          </AchievementsProvider>
        </AuthProvider>
      </ConsentProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
