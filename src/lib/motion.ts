/**
 * MÄÄK – Framer Motion presets (mjuka, icke-distraherande animationer).
 * Använd för sidövergångar, modaler och count-up.
 */
export const softSpring = { type: "spring" as const, stiffness: 200, damping: 20 };
export const gentleFade = { duration: 0.3, ease: "easeOut" as const };
export const countUp = { duration: 1.5, ease: "easeOut" as const };

export const defaultTransition = gentleFade;
