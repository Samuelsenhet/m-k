/**
 * Central place for analytics events. Screen views are fired from the root layout
 * via pathname + global search params (Expo Router screen-tracking pattern).
 *
 * Wire your provider here (PostHog, Mixpanel, etc.).
 */
export type ScreenViewPayload = {
  pathname: string;
  /** Query / dynamic segments from Expo Router */
  params: Record<string, string | string[] | undefined>;
};

export function trackScreenView(payload: ScreenViewPayload): void {
  if (__DEV__) {
    // Remove or gate behind a flag if this is too noisy during development.
    console.log('[analytics:screen]', payload.pathname, payload.params);
  }
}
