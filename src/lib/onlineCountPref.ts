const STORAGE_KEY = 'maak_show_online_count';
export const ONLINE_COUNT_PREF_EVENT = 'maak_show_online_count_change';

export function getShowOnlineCount(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null || v === 'true';
  } catch {
    return true;
  }
}

export function setShowOnlineCount(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new CustomEvent(ONLINE_COUNT_PREF_EVENT, { detail: value }));
  } catch {
    // ignore
  }
}
