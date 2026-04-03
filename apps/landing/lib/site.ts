/**
 * Base URL for the Vite web app (villkor, integritet, inloggning).
 * Sätt NEXT_PUBLIC_WEB_APP_ORIGIN=https://app.maakapp.se när webben flyttas till subdomän.
 */
export function getWebAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_WEB_APP_ORIGIN ?? "https://maakapp.se";
  return raw.replace(/\/$/, "");
}
