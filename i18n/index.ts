import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import "./types";
import { resources } from "./locales";

void i18n.use(initReactI18next).init({
  resources,
  lng: "es",
  fallbackLng: "en",
  supportedLngs: ["en", "es"],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
