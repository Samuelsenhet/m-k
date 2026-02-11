/**
 * Shown when Supabase env vars are missing.
 * Explains how to fix.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseSetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Konfigurera Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            För att använda inloggning och data behöver du sätta Supabase i{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code>.
          </p>
          <p>
            Supabase Dashboard → Settings → API: kopiera Project URL och anon key till{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> och{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
