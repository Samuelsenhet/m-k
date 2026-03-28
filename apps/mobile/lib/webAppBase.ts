const PRODUCTION_WEB = "https://maakapp.se";

/** Legal pages must be the deployed web app; Metro/LAN dev URL is not the Vite `/terms` bundle. */
function shouldOpenLegalOnProduction(base: string): boolean {
  try {
    const u = new URL(base);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    return false;
  } catch {
    return true;
  }
}

/** Base URL for MÄÄK web (legal flows, forms, full docs). */
export function getWebAppBase(): string {
  return (process.env.EXPO_PUBLIC_APP_URL || PRODUCTION_WEB).replace(/\/$/, "");
}

export function webAppUrl(path: string): string {
  const base = getWebAppBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * URL for villkor / integritet öppnade i Safari/WebBrowser från mobil.
 * Localhost, loopback och LAN-IP (Expo dev) pekar inte på den deployade webbens `/terms` — använd produktion.
 * Sätt `EXPO_PUBLIC_LEGAL_URL` om juridik ska läsas från staging.
 */
export function legalWebUrl(pathWithOptionalHash: string): string {
  const legalOverride = (process.env.EXPO_PUBLIC_LEGAL_URL || "").trim().replace(/\/$/, "");
  if (legalOverride) {
    const p = pathWithOptionalHash.startsWith("/") ? pathWithOptionalHash : `/${pathWithOptionalHash}`;
    return `${legalOverride}${p}`;
  }
  const configured = getWebAppBase();
  const base = shouldOpenLegalOnProduction(configured) ? PRODUCTION_WEB : configured;
  const p = pathWithOptionalHash.startsWith("/") ? pathWithOptionalHash : `/${pathWithOptionalHash}`;
  return `${base}${p}`;
}
