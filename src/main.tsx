import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Only load test utility in development
if (import.meta.env.DEV) {
  import("./lib/supabase-test");
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      // Error boundary renders before i18n may be fully initialized
      // Use simple fallback messages that work in both Swedish and English contexts
      const errorTitle = "Something went wrong / Något gick fel";
      const errorHint = "Please reload the page or check your .env file for Supabase credentials. / Ladda om sidan eller kontrollera din .env-fil.";
      const reloadText = "Reload / Ladda om";

      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          background: "#f2f0ef",
          color: "#253d2c",
        }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>{errorTitle}</h1>
          <p style={{ marginBottom: 16, textAlign: "center" }}>
            {errorHint}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#4b6e48",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {reloadText}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Reuse existing root when HMR re-runs this module to avoid "createRoot() on container that has already been passed to createRoot()" and DOM conflicts
const container = document.getElementById("root")!;
type Root = ReturnType<typeof createRoot>;
const root: Root = (container as HTMLElement & { _reactRoot?: Root })._reactRoot ?? createRoot(container);
(container as HTMLElement & { _reactRoot?: Root })._reactRoot = root;
root.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
