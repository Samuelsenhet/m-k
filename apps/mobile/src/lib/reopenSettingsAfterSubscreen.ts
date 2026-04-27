/**
 * When the user opens a stack screen from Inställningar (terms, about, …) we close
 * the sheet so the modal does not cover the new screen. On hardware/back navigation
 * to the profile tab, we reopen the sheet if this flag was set.
 */
let pendingReopenSettings = false;

export function markReopenSettingsAfterSubscreen(): void {
  pendingReopenSettings = true;
}

export function consumeReopenSettingsAfterSubscreen(): boolean {
  if (!pendingReopenSettings) return false;
  pendingReopenSettings = false;
  return true;
}
