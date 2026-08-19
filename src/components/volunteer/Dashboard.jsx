import { useEffect, useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import { useVolunteerGuard } from "@/hooks/useVolunteerGuard";
import { useTheme } from "@/hooks/useTheme";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton.jsx";
import LoadingSpinner from "@/components/shared/LoadingSpinner.jsx";

const APPLICATION_STATUS_LABELS = { PENDING: "En attente", ACCEPTED: "Acceptée", REJECTED: "Rejetée" };
const APPLICATION_STATUS_CLASS = { PENDING: "dash-badge--pending", ACCEPTED: "dash-badge--accepted", REJECTED: "dash-badge--rejected" };
const MISSION_STATUS_CLASS = {
  "Non disponible": "dash-badge--pending",
  "Refusé": "dash-badge--rejected",
  "Mission validée": "dash-badge--accepted",
};

export default function Dashboard() {
  const ready = useVolunteerGuard();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [me, mine] = await Promise.all([
        volunteerFetch("/volunteer-auth/me"),
        volunteerFetch("/volunteer-applications/mine"),
      ]);
      setProfile(me);
      setApplications(mine?.items || []);
      setWarnings(me?.activeWarnings || []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  const logout = () => {
    localStorage.removeItem("volunteer_token");
    window.location.href = "/mon-espace/login";
  };

  const acknowledgeWarning = async (id) => {
    try {
      await volunteerFetch(`/volunteer-auth/warnings/${id}/acknowledge`, { method: "POST" });
      setWarnings((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      alert(err.message || "Erreur lors de la validation");
    }
  };

  if (!ready || loading) return <LoadingSpinner />;
  if (error) return <LoadingSpinner message={error} error />;

  return (
    <div className="dash" data-theme={theme}>
    <div className="dash-inner">
      {warnings.length > 0 && (
        <div className="dash-warnings">
          {warnings.map((w) => (
            <div key={w._id} className="dash-warning">
              <div className="dash-warning__body">
                <strong>⚠️ Avertissement de l'équipe AMP BENIN</strong>
                <p>{w.reason}</p>
              </div>
              <button onClick={() => acknowledgeWarning(w._id)} className="dash-btn dash-btn--sm dash-warning__btn">
                J'ai compris
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dash-header">
        <div>
          <span className="dash-tagline">Mon espace volontaire</span>
          <h1 className="dash-title">Bonjour {profile.prenom} !</h1>
        </div>
        <div className="dash-header__actions">
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
          <a href="/volontaires" className="dash-btn dash-btn--primary">Postuler à un nouveau programme</a>
          <button onClick={logout} className="dash-btn dash-btn--ghost">Déconnexion</button>
        </div>
      </div>

      <section className="dash-section">
        <h2 className="dash-section__title">Mes candidatures ({applications.length})</h2>
        {applications.length === 0 ? (
          <p className="dash-empty">Vous n'avez pas encore soumis de candidature.</p>
        ) : (
          <div className="dash-list">
            {applications.map((a) => (
              <div key={a._id} className="dash-row">
                <div>
                  <strong>{a.programTitle || "Candidature spontanée"}</strong>
                  <span className="dash-row__meta">
                    Envoyée le {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <span className={`dash-badge ${APPLICATION_STATUS_CLASS[a.status]}`}>
                  {APPLICATION_STATUS_LABELS[a.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2 className="dash-section__title">Mes programmes / missions ({profile.programs.length})</h2>
        {profile.programs.length === 0 ? (
          <p className="dash-empty">Vous n'êtes rattaché(e) à aucun programme pour l'instant.</p>
        ) : (
          <div className="dash-list">
            {profile.programs.map((p, i) => (
              <a key={p.programId || i} href={`/mon-espace/programme/${p.programId}`} className="dash-row dash-row--clickable">
                <strong>{p.programTitle || "Programme"}</strong>
                <span className="dash-row__right">
                  <span className={`dash-badge ${MISSION_STATUS_CLASS[p.statut] || "dash-badge--pending"}`}>
                    {p.statut}
                  </span>
                  <span className="dash-row__chevron" aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2 className="dash-section__title">Mes attestations ({profile.attestations.length})</h2>
        {profile.attestations.length === 0 ? (
          <p className="dash-empty">Aucune attestation disponible pour l'instant.</p>
        ) : (
          <div className="dash-list">
            {profile.attestations.map((a, i) => (
              <div key={i} className="dash-row">
                <strong>{a.programTitle || "Programme"}</strong>
                {a.fileUrl ? (
                  <a href={a.fileUrl} target="_blank" rel="noreferrer" className="dash-btn dash-btn--sm">
                    Télécharger →
                  </a>
                ) : (
                  <span className="dash-row__meta">Pas encore générée</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>

      <style>{`
        /* .dash occupe TOUTE la largeur de l'écran (le fond thème va donc
           jusqu'aux bords, plus de "cadre" clair visible autour en mode
           sombre — signalé le 2026-08-18) ; .dash-inner recentre juste le
           contenu à une largeur confortable à lire, sans jamais limiter le
           fond. */
        .dash {
          width: 100%; background: var(--col-bg); color: var(--col-text); min-height: 100vh;
          transition: background var(--tr-base), color var(--tr-base);
          overflow-x: hidden; /* filet de sécurité — rien ne doit jamais faire défiler la page horizontalement */
        }
        .dash-inner { max-width: 64rem; margin: 0 auto; padding: var(--sp-8) var(--sp-4); }
        .dash-loading { text-align: center; padding: var(--sp-16); color: var(--col-text-muted); }
        .dash-loading--error { color: #dc2626; }
        .dash[data-theme="dark"] .dash-loading--error { color: #fca5a5; }

        /* Mode sombre — scopé à CETTE page uniquement (décision utilisateur,
           2026-08-18 : jamais le reste du site, voir src/hooks/useTheme.js).
           Redéfinit localement les tokens déjà utilisés partout ci-dessous
           via var(--col-*), sans toucher :root (styles/tokens.css).
           body[data-theme="dark"] en plus de .dash[data-theme="dark"]
           (signalé le 2026-08-19) : Header/Footer vivent hors de l'arbre
           React, dans BaseLayout.astro — poser aussi la variante sur body
           leur permet d'hériter les mêmes tokens, sans code supplémentaire
           de leur côté (ils utilisent déjà var(--col-*)). Header.astro
           s'adapte ainsi ; Footer.astro est déjà un bandeau sombre fixe
           (--col-footer-bg), inchangé dans les deux thèmes. */
        body[data-theme="dark"], .dash[data-theme="dark"] {
          --col-bg: #0F1A14;
          --col-surface: #16241C;
          --col-surface2: #1E3226;
          --col-border: #2A4234;
          --col-border-light: #22362A;
          --col-text: #F0EDE6;
          --col-text-sec: #C7C2B8;
          --col-text-muted: #8F9A8F;
          --col-white: #16241C;
          --col-primary: #52B788;
          --col-primary-light: #74C69D;
          --col-accent: #E8C47A;
          --col-accent-bg: rgba(201, 144, 58, 0.18);
          --col-accent-light: rgba(232, 196, 122, 0.28);
          --col-accent-xdark: #E8C47A;
          --col-success: #74C69D;
          --col-success-bg: rgba(64, 145, 108, 0.22);
          --col-error: #FCA5A5;
          --col-error-bg: rgba(193, 18, 31, 0.24);
        }
        .dash[data-theme="dark"] .dash-warning { background: rgba(185, 28, 28, 0.15); border-color: rgba(252, 165, 165, 0.4); }
        .dash[data-theme="dark"] .dash-warning__body strong { color: #fca5a5; }
        .dash[data-theme="dark"] .dash-warning__body p { color: #fecaca; }

        .dash-warnings { display: flex; flex-direction: column; gap: var(--sp-3); margin-bottom: var(--sp-6); }
        .dash-warning {
          display: flex; align-items: center; justify-content: space-between; gap: var(--sp-4); flex-wrap: wrap;
          background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--r-lg); padding: var(--sp-4);
        }
        .dash-warning__body strong { display: block; color: #b91c1c; margin-bottom: var(--sp-1); }
        .dash-warning__body p { color: #7f1d1d; font-size: var(--text-sm); margin: 0; }
        .dash-warning__btn { background: #b91c1c; color: var(--col-white); flex-shrink: 0; }
        .dash-warning__btn:hover { background: #991b1b; }

        .dash-header {
          display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap;
          gap: var(--sp-4); margin-bottom: var(--sp-8);
        }
        .dash-tagline {
          display: block; font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--col-accent); margin-bottom: var(--sp-1);
        }
        .dash-title { font-family: var(--font-heading); font-weight: 700; font-size: var(--text-2xl); color: var(--col-primary); overflow-wrap: anywhere; }
        .dash-header__actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }

        .dash-btn {
          display: inline-block; padding: var(--sp-2) var(--sp-5); border-radius: var(--r-lg);
          font-weight: 700; font-size: var(--text-sm); text-decoration: none; cursor: pointer;
          border: none; transition: background var(--tr-base), transform var(--tr-base);
        }
        .dash-btn--primary { background: var(--col-primary); color: var(--col-white); }
        .dash-btn--primary:hover { background: var(--col-primary-light); }
        .dash-btn--ghost { background: var(--col-surface2); color: var(--col-text-sec); }
        .dash-btn--ghost:hover { background: var(--col-border); }
        .dash-btn--sm { padding: var(--sp-1) var(--sp-4); font-size: var(--text-xs); background: var(--col-accent-bg); color: var(--col-accent-xdark); }
        .dash-btn--sm:hover { background: var(--col-accent-light); }

        .dash-section { margin-bottom: var(--sp-8); }
        .dash-section__title { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-lg); color: var(--col-primary); margin-bottom: var(--sp-4); }
        .dash-empty { color: var(--col-text-muted); font-size: var(--text-sm); }

        .dash-list { display: flex; flex-direction: column; gap: var(--sp-2); }
        .dash-row {
          display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
          background: var(--col-white); border: 1px solid var(--col-border-light); border-radius: var(--r-lg);
          padding: var(--sp-4); text-decoration: none; color: inherit; max-width: 100%;
        }
        /* Un titre de programme long ne doit jamais pousser la carte hors de
           l'écran (signalé le 2026-08-18) — le premier enfant flex doit
           pouvoir rétrécir/wrapper au lieu de forcer une largeur minimale. */
        .dash-row > *:first-child { min-width: 0; overflow-wrap: anywhere; }
        .dash-row--clickable { cursor: pointer; transition: border-color var(--tr-base), transform var(--tr-base); }
        .dash-row--clickable:hover { border-color: var(--col-primary); transform: translateX(2px); }
        .dash-row__right { display: flex; align-items: center; gap: var(--sp-3); }
        .dash-row__chevron { color: var(--col-text-muted); font-weight: 700; }
        .dash-row__meta { display: block; font-size: var(--text-xs); color: var(--col-text-muted); margin-top: 2px; }

        .dash-badge { font-size: var(--text-xs); font-weight: 700; padding: var(--sp-1) var(--sp-3); border-radius: var(--r-full); white-space: nowrap; }
        .dash-badge--pending { background: var(--col-surface2); color: var(--col-text-sec); }
        .dash-badge--accepted { background: var(--col-success-bg); color: var(--col-success); }
        .dash-badge--rejected { background: var(--col-error-bg); color: var(--col-error); }

        /* 100% responsive mobile (décision utilisateur, 2026-08-18) */
        @media (max-width: 640px) {
          .dash-inner { padding: var(--sp-5) var(--sp-3); }
          .dash-title { font-size: var(--text-xl); }
          .dash-header { flex-direction: column; align-items: stretch; }
          .dash-header__actions { width: 100%; }
          .dash-header__actions .dash-btn { flex: 1 1 auto; text-align: center; }
          .dash-row { flex-direction: column; align-items: flex-start; gap: var(--sp-2); }
          .dash-row__right { width: 100%; justify-content: space-between; }
          .dash-warning { flex-direction: column; align-items: stretch; }
          .dash-warning__btn { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}
