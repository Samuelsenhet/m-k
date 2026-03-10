import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { normalizeDisplayCommas } from '@/lib/utils';

import sv from './locales/sv.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'sv';

/** Recursively normalize comma characters in translation resources. */
function normalizeResource(obj: unknown): unknown {
  if (typeof obj === 'string') return normalizeDisplayCommas(obj);
  if (Array.isArray(obj)) return obj.map(normalizeResource);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, normalizeResource(v)])
    );
  }
  return obj;
}

i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: normalizeResource(sv) as typeof sv },
    en: { translation: normalizeResource(en) as typeof en },
  },
  lng: savedLanguage,
  fallbackLng: 'sv',
  interpolation: {
    escapeValue: false,
    format: (value: unknown) =>
      typeof value === 'string' ? normalizeDisplayCommas(value) : value,
  },
});

// Ensure every translated string displayed in the app uses normal commas
const originalT = i18n.t.bind(i18n);
i18n.t = ((...args: Parameters<typeof i18n.t>) => {
  const result = originalT(...args);
  return typeof result === 'string' ? normalizeDisplayCommas(result) : result;
}) as typeof i18n.t;

export default i18n;
