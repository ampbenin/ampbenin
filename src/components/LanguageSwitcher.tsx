import { useState, useEffect, useRef } from 'react';

const LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

const COOKIE_NAME = 'lang';

// Pose le cookie de langue et recharge la MÊME page (aucune navigation,
// aucun changement d'URL) pour que le contenu se rende dans la langue
// choisie côté serveur.
function setLangCookie(code: string) {
  document.cookie = `${COOKIE_NAME}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.location.reload();
}

interface Props {
  currentLang: string;
  variant?: 'desktop' | 'mobile';
}

export default function LanguageSwitcher({ currentLang, variant = 'desktop' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = LANGS.find(l => l.code === currentLang) ?? LANGS[0];

  if (variant === 'mobile') {
    return (
      <div className="ls-mobile" role="group" aria-label="Changer de langue">
        {LANGS.map(({ code, label, flag }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLangCookie(code)}
            className={code === currentLang ? 'ls-pill ls-pill--active' : 'ls-pill'}
            aria-current={code === currentLang ? 'true' : undefined}
          >
            <span aria-hidden="true">{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="ls-wrap">
      <button
        className="ls-btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Langue : ${active.label}`}
      >
        <span aria-hidden="true">{active.flag}</span>
        <span>{active.label}</span>
        <svg
          className={open ? 'ls-chevron ls-chevron--open' : 'ls-chevron'}
          viewBox="0 0 24 24"
          fill="none"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="ls-dropdown" role="listbox" aria-label="Choisir une langue">
          {LANGS.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => { setOpen(false); setLangCookie(code); }}
              className={code === currentLang ? 'ls-option ls-option--active' : 'ls-option'}
              role="option"
              aria-selected={code === currentLang}
            >
              <span aria-hidden="true">{flag}</span>
              <span>{label}</span>
              {code === currentLang && (
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ marginInlineStart: 'auto' }} aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
