import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "../../../src/i18n/locales/en.json";
import sv from "../../../src/i18n/locales/sv.json";

const deviceLng =
  Localization.getLocales()[0]?.languageCode?.startsWith("en") ? "en" : "sv";

void i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: sv },
    en: { translation: en },
  },
  lng: deviceLng,
  fallbackLng: "sv",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export { i18n };
