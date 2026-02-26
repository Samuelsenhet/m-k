/** localStorage key: set after first Määk intro on Landing. */
export const MAEK_INTRO_SEEN_KEY = "maek_intro_seen";

/** Määk journey copy – single source of truth (production v1). */
export const MAEK_COPY = {
  /** Landing hero – first identity intro. */
  intro:
    "Jag heter Määk.\nJag finns här med dig, medan vi hittar någon som verkligen passar.",
  /** Onboarding welcome – Määk as guide. */
  guide: "Jag guidar dig lugnt genom det här.",
  /** Waiting phase – relation, not system. */
  waiting: "Jag är här medan vi väntar. Bra saker får ta tid.",
  /** First match – emotional payoff. */
  firstMatch: "Jag sa ju att det var värt att vänta. 💛",
} as const;

export function hasSeenMaekIntro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MAEK_INTRO_SEEN_KEY) === "true";
}

export function setMaekIntroSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAEK_INTRO_SEEN_KEY, "true");
}
