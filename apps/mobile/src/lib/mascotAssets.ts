/**
 * Bundled mascot images for React Native (`require` must be static).
 * Token choices align with `STATE_TOKEN_MAP` in web `src/lib/mascot/index.ts`.
 */
export const MascotAssets = {
  /** `landing_hero`, onboarding welcome, moment-of-depth */
  onboarding: require("../../assets/images/mascot/onboarding.png"),
  /** Landing card badge — matches web `/mascot/sitting.png` */
  sitting: require("../../assets/images/mascot/sitting.png"),
  /** `waiting_phase`, `loading` */
  waitingTea: require("../../assets/images/mascot/mascot_waiting_tea.png"),
  /** `no_chats` */
  practicingMirror: require("../../assets/images/mascot/mascot_practicing_mirror.png"),
  /** `empty_matches` */
  plantingSeed: require("../../assets/images/mascot/mascot_planting_seed.png"),
  /** `first_match` */
  lightingLantern: require("../../assets/images/mascot/mascot_lighting_lantern.png"),
} as const;
