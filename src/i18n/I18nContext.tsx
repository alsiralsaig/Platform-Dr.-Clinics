import React from 'react';
import type { AppLang } from '../data/sudanGeo';
import { translations, type TranslationSchema } from './translations';

interface I18nContextValue {
  lang: AppLang;
  dir: 'rtl' | 'ltr';
  setLang: (next: AppLang) => void;
  toggleLang: () => void;
  t: TranslationSchema;
}

const STORAGE_KEY = 'sd_med_lang';

const I18nContext = React.createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = React.useState<AppLang>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title =
      lang === 'ar'
        ? 'المنصة الطبية السودانية الذكية | الرعاية الصحية الرقمية الموحدة'
        : 'Sudanese Smart Medical Platform | Unified Digital Healthcare';
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }, [lang, dir]);

  const setLang = React.useCallback((next: AppLang) => {
    setLangState(next);
  }, []);

  const toggleLang = React.useCallback(() => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      lang,
      dir,
      setLang,
      toggleLang,
      t: translations[lang],
    }),
    [lang, dir, setLang, toggleLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
