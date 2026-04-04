/**
 * CORS for browser clients: production origin from env, plus localhost/127.0.0.1 for Vite dev.
 * Deployed secrets may set ALLOWED_ORIGIN or CORS_ORIGIN to https://maakapp.se — without this,
 * preflight from http://localhost:8080 fails (ACAO must match request Origin).
 */

const DEFAULT_ORIGIN = "https://maakapp.se";

function isLocalHttpOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:") return false;
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Value for Access-Control-Allow-Origin (single origin; reflects allowed callers). */
export function resolveCorsAllowOrigin(req: Request): string {
  const requestOrigin = req.headers.get("Origin");
  const primary = (
    Deno.env.get("ALLOWED_ORIGIN") ||
    Deno.env.get("CORS_ORIGIN") ||
    DEFAULT_ORIGIN
  ).trim();

  const extras = (Deno.env.get("CORS_EXTRA_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!requestOrigin) return primary;
  if (requestOrigin === primary) return requestOrigin;
  if (extras.includes(requestOrigin)) return requestOrigin;
  if (isLocalHttpOrigin(requestOrigin)) return requestOrigin;

  return primary;
}

export function corsHeadersFor(req: Request, allowMethods: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveCorsAllowOrigin(req),
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": allowMethods,
  };
}
