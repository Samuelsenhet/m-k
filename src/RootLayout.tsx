import { Outlet } from "react-router-dom";
import { useConsent } from "@/contexts/useConsent";
import { GdprOnboarding } from "@/components/onboarding/GdprOnboarding";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { DevDiagnosticsPanel } from "@/components/dev/DevDiagnosticsPanel";

/**
 * Root layout for Data Router. Handles consent loading and GDPR banner,
 * then renders the matched route via Outlet.
 */
export function RootLayout() {
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
      <Outlet />
      <InstallPrompt />
      <DevDiagnosticsPanel />
    </>
  );
}
