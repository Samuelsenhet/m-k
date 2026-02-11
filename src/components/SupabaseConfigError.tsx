/**
 * Shown when Supabase is not configured.
 * Prevents users from reaching login/matches and seeing env errors.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Supabase är inte konfigurerad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Backend är inte konfigurerad för denna miljö. Lägg till{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> och{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code> i{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code> (kopiera från{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code>).
          </p>
          <p>
            Hämta värdena från Supabase Dashboard → Projekt → Settings → API.
          </p>
          <p>
            <strong>Kontakta support</strong> om du inte har tillgång till projektet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
