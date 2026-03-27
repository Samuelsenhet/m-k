/** Base URL for MÄÄK web (legal flows, forms, full docs). */
export function getWebAppBase(): string {
  return (process.env.EXPO_PUBLIC_APP_URL || "https://maakapp.se").replace(/\/$/, "");
}

export function webAppUrl(path: string): string {
  const base = getWebAppBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
