import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { getLocales } from "expo-localization";
import { initReactI18next } from "react-i18next";

import "./types";
import { resources } from "./locales";

export type AppLanguage = "en" | "es";

export const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "es"];

const LANGUAGE_STORAGE_KEY = "app.language";

function normalizeLanguage(code?: string | null): AppLanguage | null {
  if (!code) return null;
  const base = code.split("-")[0]?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(base as AppLanguage)
    ? (base as AppLanguage)
    : null;
}

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  init: () => {},
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      const saved = normalizeLanguage(storedLanguage);
      if (saved) {
        callback(saved);
        return;
      }
    } catch {
      // Fall back to device locale
    }

    const deviceLocale = getLocales()[0]?.languageCode;
    callback(normalizeLanguage(deviceLocale) ?? "en");
  },
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage write failed — non-critical
    }
  },
};

void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
