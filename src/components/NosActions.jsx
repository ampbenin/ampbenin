// src/components/NosActions.jsx
// Logique de filtrage (useState, filter, match regex) conservée à l'identique
import { useState, useEffect, useRef } from "react";

const FALLBACK_ACTIONS = [
  {
    title: "Projet À l'écoute des jeunes (2023)",
    description:
      "Renforcement de capacités des jeunes filles dans les communes de Tori-Bossito et Kpomassè sur la SSR, la prévention des VBG et l'autonomisation des femmes. Ce projet a duré 6 mois et a permis de former et accompagner plusieurs bénéficiaires.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903892/ong-site/images/forum-jeunesse.webp",
    type: "image",
    theme: "SSR",
  },
  {
    title: "16 jours d'activisme contre les VBG (2024)",
    description:
      "Mobilisation de plus de 200 jeunes volontaires pour une campagne digitale et communautaire de grande envergure. AMP BENIN a été reconnu comme jeune organisation championne par Plan International West and Central Africa.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903906/ong-site/images/16jours/Lancement-16jours.webp",
    type: "image",
    report: "/docs/rapport-vbg.pdf",
    theme: "VBG",
  },
  {
    title: "Projet MyCountry229 (2025)",
    description:
      "Campagne nationale digitale innovante mobilisant des centaines de jeunes autour de la citoyenneté, des ODD et de la lutte contre la désinformation. Un projet qui a marqué l'engagement citoyen numérique au Bénin.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903905/ong-site/images/campagne-mycountry229-paix-benin.png",
    type: "image",
    report: "/docs/rapport-mycountry229.pdf",
    theme: "Citoyenneté",
  },
  {
    title: "Projet SWEED1 (2024) (2023)",
    description:
      "Implication d'AMP BENIN dans les communes de Tori-Bossito et Kpomassè, avec un focus sur le renforcement de capacités et l'autonomisation des femmes, en collaboration avec les guichets uniques de protection sociale.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903894/ong-site/images/sante-bienetre-social.webp",
    type: "image",
    theme: "Autonomisation",
  },
  {
    title: "Projet ARS3 avec PSI/AMBS (2025)",
    description:
      "Partenaire d'exécution dans la commune de Comè (Mono) pour la sensibilisation des communautés, femmes enceintes et jeunes filles à l'accès aux services de santé.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903897/ong-site/images/is/sfpf.webp",
    type: "image",
    theme: "SSR",
  },
  {
    title: "Espace jeunesse (2024)",
    description:
      "Création d'un espace dédié aux jeunes pour favoriser leur participation citoyenne, leur accès à l'information et aux ressources éducatives, ainsi que leur engagement actif dans la prévention des VBG et la promotion de la SSR.",
    media: "https://res.cloudinary.com/diongmuh8/image/upload/f_auto,q_auto,w_800/v1780903900/ong-site/images/is/sccs.webp",
    type: "image",
    theme: "Jeunesse",
  },
];

const THEME_COLORS = {
  SSR:             { bg: "#1B4332", text: "#ffffff" },
  VBG:             { bg: "#C9903A", text: "#ffffff" },
  Citoyenneté:     { bg: "#2D6A4F", text: "#ffffff" },
  Autonomisation:  { bg: "#7C3AED", text: "#ffffff" },
  Jeunesse:        { bg: "#0369A1", text: "#ffffff" },
};

// Hook fade-up au scroll
function useFadeUp(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { el.style.opacity = "1"; return; }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

function ActionCard({ act, delay }) {
  const ref = useRef(null);
  useFadeUp(ref);
  const yearMatch = act.title.match(/\((\d{4})\)/);
  const year = act.year || (yearMatch ? yearMatch[1] : null);
  const themeStyle = THEME_COLORS[act.theme] || { bg: "#1B4332", text: "#ffffff" };

  return (
    <article
      ref={ref}
      className="act-card"
      style={{ transitionDelay: `${delay}s` }}
    >
      {/* Image */}
      <div className="act-card__media">
        {act.type === "image" ? (
          <img
            src={act.media}
            alt={act.title}
            className="act-card__img"
            loading="lazy"
          />
        ) : (
          <video src={act.media} controls className="act-card__img" />
        )}
        {/* Badge thème */}
        <span
          className="act-card__theme-badge"
          style={{ background: themeStyle.bg, color: themeStyle.text }}
        >
          {act.theme}
        </span>
        {/* Badge année */}
        {year && (
          <span className="act-card__year-badge">{year}</span>
        )}
      </div>

      {/* Corps */}
      <div className="act-card__body">
        <h3 className="act-card__title">{act.title}</h3>
        <p className="act-card__desc">{act.description}</p>
        {(act.report || act.reportUrl) && (
          <a
            href={act.report || act.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="act-card__report-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Consulter le rapport
          </a>
        )}
      </div>
    </article>
  );
}

export default function NosActions() {
  // Contenu géré depuis le CMS admin (/admin/dashboard → Actions / Projets),
  // avec repli sur les cartes codées en dur si l'API est indisponible.
  const [actions, setActions] = useState(FALLBACK_ACTIONS);

  useEffect(() => {
    const apiBase = import.meta.env.PUBLIC_API_BASE || '';
    fetch(`${apiBase}/api/cms/actions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setActions(data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Logique de filtrage identique
  const [selectedYear,  setSelectedYear]  = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");

  const getYear = (act) => {
    const m = act.title.match(/\((\d{4})\)/);
    return String(act.year || (m ? m[1] : ""));
  };

  const availableYears = [...new Set(actions.map(getYear).filter(Boolean))].sort((a, b) => b - a);

  const filtered = actions.filter((act) => {
    const yearMatch = selectedYear === "all" || getYear(act) === selectedYear;
    const themeMatch = selectedTheme === "all" || act.theme === selectedTheme;
    return yearMatch && themeMatch;
  });

  return (
    <main className="act-page">

      {/* En-tête */}
      <section className="act-header">
        <span className="section-label section-label--green">Nos expériences</span>
        <h1 className="act-heading">
          SSR, VBG &amp; mobilisation citoyenne
        </h1>
        <p className="act-subheading">
          Un parcours d'actions concrètes pour l'autonomisation, la prévention et la transformation sociale.
        </p>
      </section>

      {/* Filtres */}
      <section className="act-filters" aria-label="Filtrer les actions">
        <div className="act-filter-group">
          <label htmlFor="filter-year" className="act-filter-label">Année</label>
          <select
            id="filter-year"
            className="act-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">Toutes les années</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="act-filter-group">
          <label htmlFor="filter-theme" className="act-filter-label">Thématique</label>
          <select
            id="filter-theme"
            className="act-select"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
          >
            <option value="all">Toutes les thématiques</option>
            <option value="SSR">SSR</option>
            <option value="VBG">VBG</option>
            <option value="Citoyenneté">Citoyenneté</option>
            <option value="Autonomisation">Autonomisation</option>
            <option value="Jeunesse">Jeunesse</option>
          </select>
        </div>

        {(selectedYear !== "all" || selectedTheme !== "all") && (
          <button
            className="act-filter-reset"
            onClick={() => { setSelectedYear("all"); setSelectedTheme("all"); }}
          >
            Tout afficher
          </button>
        )}
      </section>

      {/* Grille des actions */}
      <section className="act-grid" aria-label="Liste des actions">
        {filtered.length > 0 ? (
          filtered.map((act, i) => (
            <ActionCard key={act.title} act={act} delay={i * 0.08} />
          ))
        ) : (
          <p className="act-empty">Aucune action ne correspond à ces filtres.</p>
        )}
      </section>

      {/* Section inspiration */}
      <section className="act-inspire">
        <h2 className="act-inspire__title">
          AMP BENIN : Une organisation au service du changement
        </h2>
        <p className="act-inspire__text">
          Grâce à nos projets et campagnes, nous avons bâti une expertise solide en santé sexuelle et reproductive, lutte contre les VBG, autonomisation des femmes et mobilisation citoyenne. Nos expériences passées et présentes prouvent notre capacité à mener à bien toute initiative ambitieuse et inclusive pour le bien-être des communautés.
        </p>
      </section>

      <style>{`
        .act-page {
          max-width: var(--container);
          margin-inline: auto;
          padding-inline: var(--sp-6);
          padding-top: var(--sp-16);
          padding-bottom: var(--sp-16);
        }

        /* En-tête */
        .act-header {
          text-align: center;
          margin-bottom: var(--sp-12);
        }
        .act-heading {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
          color: var(--col-primary);
          line-height: 1.12;
          margin-bottom: var(--sp-3);
        }
        .act-subheading {
          font-family: var(--font-body);
          font-size: var(--text-lg);
          color: var(--col-text-sec);
          font-style: italic;
          max-width: 42rem;
          margin-inline: auto;
        }

        /* Filtres */
        .act-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: center;
          gap: var(--sp-4);
          margin-bottom: var(--sp-12);
        }
        .act-filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--sp-1);
        }
        .act-filter-label {
          font-family: var(--font-body);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--col-text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .act-select {
          padding: var(--sp-2) var(--sp-4);
          padding-right: var(--sp-8);
          background: var(--col-white);
          border: 1.5px solid var(--col-border);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--col-text);
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B4332' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right var(--sp-3) center;
          background-size: 1rem;
          box-shadow: var(--sh-sm);
          transition: border-color var(--tr-base), box-shadow var(--tr-base);
        }
        .act-select:focus {
          border-color: var(--col-primary);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
        }
        .act-filter-reset {
          padding: var(--sp-2) var(--sp-4);
          background: none;
          border: 1.5px solid var(--col-accent);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--col-accent);
          cursor: pointer;
          transition: background var(--tr-base), color var(--tr-base);
        }
        .act-filter-reset:hover { background: var(--col-accent); color: var(--col-white); }

        /* Grille */
        .act-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--sp-8);
        }
        @media (min-width: 640px)  { .act-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .act-grid { grid-template-columns: repeat(3, 1fr); } }

        .act-empty {
          grid-column: 1 / -1;
          text-align: center;
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--col-text-muted);
          padding: var(--sp-16);
        }

        /* Carte */
        .act-card {
          background: var(--col-white);
          border-radius: var(--r-2xl);
          overflow: hidden;
          box-shadow: var(--sh-sm);
          border: 1px solid var(--col-border-light);
          display: flex;
          flex-direction: column;
          transition: transform var(--tr-base), box-shadow var(--tr-base);
        }
        .act-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--sh-lg);
        }

        /* Media */
        .act-card__media {
          position: relative;
          overflow: hidden;
          aspect-ratio: 16/10;
          background: var(--col-primary-bg);
        }
        .act-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform var(--tr-slow);
        }
        .act-card:hover .act-card__img { transform: scale(1.06); }

        /* Badges */
        .act-card__theme-badge {
          position: absolute;
          top: var(--sp-3);
          left: var(--sp-3);
          font-family: var(--font-body);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: var(--sp-1) var(--sp-3);
          border-radius: var(--r-full);
          box-shadow: var(--sh-sm);
        }
        .act-card__year-badge {
          position: absolute;
          bottom: var(--sp-3);
          right: var(--sp-3);
          background: rgba(10, 28, 18, 0.80);
          color: var(--col-accent-light);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: var(--text-sm);
          padding: var(--sp-1) var(--sp-3);
          border-radius: var(--r-full);
          backdrop-filter: blur(6px);
        }

        /* Corps carte */
        .act-card__body {
          padding: var(--sp-6);
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: var(--sp-3);
        }
        .act-card__title {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: var(--text-lg);
          color: var(--col-primary);
          line-height: 1.3;
        }
        .act-card__desc {
          font-family: var(--font-body);
          font-size: var(--text-sm);
          color: var(--col-text-sec);
          line-height: 1.7;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .act-card__report-link {
          display: inline-flex;
          align-items: center;
          gap: var(--sp-2);
          margin-top: var(--sp-2);
          padding: var(--sp-2) var(--sp-4);
          background: var(--col-primary);
          color: var(--col-white);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 600;
          border-radius: var(--r-lg);
          text-decoration: none;
          transition: background var(--tr-base), transform var(--tr-base);
          width: fit-content;
        }
        .act-card__report-link svg { width: 1rem; height: 1rem; flex-shrink: 0; }
        .act-card__report-link:hover { background: var(--col-primary-light); transform: scale(1.03); }
        .act-card__report-link:focus-visible { outline: 2px solid var(--col-primary); outline-offset: 3px; }

        /* Section inspiration */
        .act-inspire {
          margin-top: var(--sp-20);
          text-align: center;
          padding: var(--sp-12) var(--sp-6);
          background: var(--col-primary-bg);
          border-radius: var(--r-2xl);
        }
        .act-inspire__title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: clamp(var(--text-2xl), 3vw, var(--text-4xl));
          color: var(--col-primary);
          margin-bottom: var(--sp-4);
        }
        .act-inspire__text {
          font-family: var(--font-body);
          font-size: var(--text-lg);
          color: var(--col-text-sec);
          max-width: 42rem;
          margin-inline: auto;
          line-height: 1.7;
        }
      `}</style>
    </main>
  );
}
