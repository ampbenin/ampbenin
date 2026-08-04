import fr from './translations/fr';
import en from './translations/en';
import es from './translations/es';
import ar from './translations/ar';

export const translations = { fr, en, es, ar } as const;
export type Lang = keyof typeof translations;
export const defaultLang: Lang = 'fr';
export const supportedLangs: Lang[] = ['fr', 'en', 'es', 'ar'];

export const LANG_COOKIE = 'lang';

// La langue n'est plus portée par l'URL (plus de préfixe /en, /es, /ar) :
// elle vient d'un cookie posé par le sélecteur de langue. Sans cookie (ou
// valeur invalide), on retombe sur le français — jamais de 404.
export function resolveLang(Astro: { cookies: { get(name: string): { value?: string } | undefined } }): Lang {
  const cookieValue = Astro.cookies.get(LANG_COOKIE)?.value;
  if (cookieValue && (supportedLangs as string[]).includes(cookieValue)) {
    return cookieValue as Lang;
  }
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
