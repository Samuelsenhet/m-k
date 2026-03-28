import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "../../../src/i18n/locales/en.json";
import legalMobile from "../../../src/i18n/locales/legal.mobile.json";
import sv from "../../../src/i18n/locales/sv.json";

/** Prefer expo-localization; fall back if native binding is missing (e.g. version skew / bad interop). */
function resolveDeviceLng(): "en" | "sv" {
  try {
    if (typeof getLocales === "function") {
      const locales = getLocales();
      const code = locales[0]?.languageCode;
      if (code?.toLowerCase().startsWith("en")) return "en";
      return "sv";
    }
  } catch {
    /* ignore */
  }
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    return tag.toLowerCase().startsWith("en") ? "en" : "sv";
  } catch {
    return "sv";
  }
}

const deviceLng = resolveDeviceLng();

const svTranslation = { ...sv, ...legalMobile.sv };
const enTranslation = { ...en, ...legalMobile.en };

void i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: svTranslation },
    en: { translation: enTranslation },
  },
  lng: deviceLng,
  fallbackLng: "sv",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export { i18n };
