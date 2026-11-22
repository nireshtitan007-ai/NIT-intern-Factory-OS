import { useState, useCallback } from 'react';
import en from './en.json';
import ta from './ta.json';

export type Language = 'en' | 'ta';

export function useT() {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('zenlyft_lang');
      return stored === 'ta' ? 'ta' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('zenlyft_lang', newLang);
    } catch {
      // Ignore localStorage failure in restricted sandbox
    }
  }, []);

  const toggleLang = useCallback(() => {
    const next: Language = lang === 'en' ? 'ta' : 'en';
    setLang(next);
  }, [lang, setLang]);

  const t = useCallback((key: string, defaultVal?: string): string => {
    const dict = lang === 'ta' ? (ta as Record<string, string>) : (en as Record<string, string>);
    return dict[key] || defaultVal || key;
  }, [lang]);

  return { lang, setLang, toggleLang, t };
}
