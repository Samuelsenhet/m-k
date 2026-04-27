/**
 * Shown when Supabase env vars are missing or invalid.
 * Explains how to fix and offers links to demo routes.
 */
export function SupabaseSetupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(to bottom, #f2f0ef 0%, #e8e6e4 100%)",
        color: "#253d2c",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: 8, fontWeight: 700 }}>
        Supabase är inte konfigurerad
      </h1>
      <p style={{ marginBottom: 24, textAlign: "center", maxWidth: 420, lineHeight: 1.5 }}>
        Lägg till <code style={{ background: "#e0e0e0", padding: "2px 6px", borderRadius: 4 }}>VITE_SUPABASE_URL</code> och{" "}
        <code style={{ background: "#e0e0e0", padding: "2px 6px", borderRadius: 4 }}>VITE_SUPABASE_PUBLISHABLE_KEY</code> i{" "}
        <strong>.env</strong> i projektets rot (samma mapp som package.json). Starta om dev-servern efter ändring.
      </p>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", marginBottom: 8 }}>Hämta värden från:</p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#4b6e48",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          supabase.com/dashboard → Projekt → Settings → API
        </a>
      </div>
      <p style={{ fontSize: "0.875rem", marginBottom: 16, color: "#666" }}>
        Vill du bara testa appen? Använd demot utan inloggning:
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/demo-seed"
          style={{
            padding: "10px 20px",
            background: "#4b6e48",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Demo – matchningar & chatt
        </a>
        <a
          href="/demo-samlingar"
          style={{
            padding: "10px 20px",
            background: "#5a7a56",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Demo – gruppchatt (Samlingar)
        </a>
      </div>
      <p style={{ marginTop: 24, fontSize: "0.75rem", color: "#888" }}>
        Se <strong>CHECK_SETUP.md</strong> i projektet för steg-för-steg.
      </p>
    </div>
  );
}
