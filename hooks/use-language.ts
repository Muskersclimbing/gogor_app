import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";

function normalizeLanguage(code?: string): AppLanguage {
  const base = code?.split("-")[0]?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(base as AppLanguage)
    ? (base as AppLanguage)
    : "en";
}

export function useLanguage() {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.language);

  const setLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      if (nextLanguage === language) return;
      await i18n.changeLanguage(nextLanguage);
    },
    [i18n, language],
  );

  return {
    language,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
