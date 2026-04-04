/**
 * Base URL for the main web app (Vite; villkor, integritet, inloggning).
 * Sätt NEXT_PUBLIC_WEB_APP_ORIGIN=https://app.maakapp.se när webben flyttas till subdomän.
 */
export function getWebAppOrigin(): string {
  const v = process.env.NEXT_PUBLIC_WEB_APP_ORIGIN;
  const raw = v && v.trim() !== "" ? v.trim() : "https://maakapp.se";
  return raw.replace(/\/$/, "");
}
