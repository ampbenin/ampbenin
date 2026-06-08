import fr from './translations/fr';
import en from './translations/en';
import es from './translations/es';
import ar from './translations/ar';

export const translations = { fr, en, es, ar } as const;
export type Lang = keyof typeof translations;
export const defaultLang: Lang = 'fr';
export const supportedLangs: Lang[] = ['fr', 'en', 'es', 'ar'];

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first && first in translations) return first as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t<
    Section extends keyof typeof fr,
    Key extends keyof (typeof fr)[Section],
  >(section: Section, key: Key): string {
    return (translations[lang][section] as Record<string, string>)[key as string]
      ?? (fr[section] as Record<string, string>)[key as string]
      ?? String(key);
  };
}

export function getRouteInLang(currentPath: string, targetLang: Lang): string {
  const segments = currentPath.split('/').filter(Boolean);

  if (segments.length > 0 && supportedLangs.includes(segments[0] as Lang) && segments[0] !== defaultLang) {
    segments.shift();
  }

  if (targetLang === defaultLang) {
    return '/' + segments.join('/');
  }

  return '/' + [targetLang, ...segments].join('/');
}
