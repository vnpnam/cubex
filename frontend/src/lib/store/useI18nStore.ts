import { create } from 'zustand';
import { translations, Language } from '../i18n/translations';

interface I18nState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: keyof typeof translations['vi']) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  lang: 'vi',
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cubex_lang', lang);
    }
    set({ lang });
  },
  toggleLang: () => {
    const nextLang = get().lang === 'vi' ? 'en' : 'vi';
    if (typeof window !== 'undefined') {
      localStorage.setItem('cubex_lang', nextLang);
    }
    set({ lang: nextLang });
  },
  t: (key) => {
    const { lang } = get();
    return translations[lang][key] || translations['en'][key] || key;
  }
}));
