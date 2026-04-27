/** localStorage key: set after first Määk intro on Landing. */
export const MAEK_INTRO_SEEN_KEY = "maek_intro_seen";

export function hasSeenMaekIntro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MAEK_INTRO_SEEN_KEY) === "true";
}

export function setMaekIntroSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAEK_INTRO_SEEN_KEY, "true");
}
