import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  notificationsNewMatches: 'mk_notif_new_matches',
  notificationsMessages: 'mk_notif_messages',
  privacyProfileVisibility: 'mk_privacy_visibility',
  privacySharedData: 'mk_privacy_shared_data',
} as const;

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export interface LocalSettings {
  notificationsNewMatches: boolean;
  notificationsMessages: boolean;
  privacyProfileVisibility: boolean;
  privacySharedData: boolean;
}

const DEFAULTS: LocalSettings = {
  notificationsNewMatches: true,
  notificationsMessages: true,
  privacyProfileVisibility: true,
  privacySharedData: false,
};

/**
 * Notification and privacy toggles persisted in localStorage.
 * Backend can be wired later; for now UI is functional and prefs survive refresh.
 */
export function useLocalSettings(): LocalSettings & {
  setNotificationsNewMatches: (v: boolean) => void;
  setNotificationsMessages: (v: boolean) => void;
  setPrivacyProfileVisibility: (v: boolean) => void;
  setPrivacySharedData: (v: boolean) => void;
} {
  const [settings, setSettings] = useState<LocalSettings>(() => ({
    notificationsNewMatches: readBool(STORAGE_KEYS.notificationsNewMatches, DEFAULTS.notificationsNewMatches),
    notificationsMessages: readBool(STORAGE_KEYS.notificationsMessages, DEFAULTS.notificationsMessages),
    privacyProfileVisibility: readBool(STORAGE_KEYS.privacyProfileVisibility, DEFAULTS.privacyProfileVisibility),
    privacySharedData: readBool(STORAGE_KEYS.privacySharedData, DEFAULTS.privacySharedData),
  }));

  useEffect(() => {
    writeBool(STORAGE_KEYS.notificationsNewMatches, settings.notificationsNewMatches);
  }, [settings.notificationsNewMatches]);
  useEffect(() => {
    writeBool(STORAGE_KEYS.notificationsMessages, settings.notificationsMessages);
  }, [settings.notificationsMessages]);
  useEffect(() => {
    writeBool(STORAGE_KEYS.privacyProfileVisibility, settings.privacyProfileVisibility);
  }, [settings.privacyProfileVisibility]);
  useEffect(() => {
    writeBool(STORAGE_KEYS.privacySharedData, settings.privacySharedData);
  }, [settings.privacySharedData]);

  const setNotificationsNewMatches = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, notificationsNewMatches: v }));
  }, []);
  const setNotificationsMessages = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, notificationsMessages: v }));
  }, []);
  const setPrivacyProfileVisibility = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, privacyProfileVisibility: v }));
  }, []);
  const setPrivacySharedData = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, privacySharedData: v }));
  }, []);

  return {
    ...settings,
    setNotificationsNewMatches,
    setNotificationsMessages,
    setPrivacyProfileVisibility,
    setPrivacySharedData,
  };
}
