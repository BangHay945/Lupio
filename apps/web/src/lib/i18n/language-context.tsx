"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, TranslationKey, translations } from "./translations";

export interface LanguageOption {
  code: Language;
  label: string;
  short: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "id", label: "Bahasa Indonesia", short: "ID", flag: "🇮🇩" },
  { code: "en", label: "English", short: "EN", flag: "GB", flagEmoji: "🇬🇧" } as any,
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "id", label: "Bahasa Indonesia", short: "ID", flag: "🇮🇩" },
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "lupio_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "id" || saved === "en")) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = "id";
      }
    } catch {
      // fallback
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language] || translations.id;
    if (key in dict) {
      return (dict as Record<string, string>)[key] || fallback || key;
    }
    // Fallback to id if key not found in current language
    const fallbackDict = translations.id;
    if (key in fallbackDict) {
      return (fallbackDict as Record<string, string>)[key] || fallback || key;
    }
    return fallback || key;
  };

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentOption }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      language: "id" as Language,
      setLanguage: () => {},
      t: (key: TranslationKey, fallback?: string) =>
        translations.id[key] || fallback || key,
      currentOption: LANGUAGE_OPTIONS[0],
    };
  }
  return context;
}
