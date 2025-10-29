import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import tr from './locales/tr.json';
import el from './locales/el.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  el: { translation: el },
};

// Force English during e2e to make text assertions stable
if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_E2E_BYPASS_AUTH === '1') {
  try {
    window.localStorage.setItem('i18nextLng', 'en');
  } catch {}
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

