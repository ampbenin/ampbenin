import { useEffect, useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import { useVolunteerGuard } from "@/hooks/useVolunteerGuard";

const APPLICATION_STATUS_LABELS = { PENDING: "En attente", ACCEPTED: "Acceptée", REJECTED: "Rejetée" };
const APPLICATION_STATUS_CLASS = { PENDING: "dash-badge--pending", ACCEPTED: "dash-badge--accepted", REJECTED: "dash-badge--rejected" };
const MISSION_STATUS_CLASS = {
  "Non disponible": "dash-badge--pending",
  "Refusé": "dash-badge--rejected",
  "Mission validée": "dash-badge--accepted",
};

export default function Dashboard() {
  const ready = useVolunteerGuard();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
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

  if (!ready || loading) return <p className="dash-loading">Chargement...</p>;
  if (error) return <p className="dash-loading dash-loading--error">{error}</p>;

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="dash-tagline">Mon espace volontaire</span>
          <h1 className="dash-title">Bonjour {profile.prenom} !</h1>
        </div>
        <div className="dash-header__actions">
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

      <style>{`
        .dash { max-width: 48rem; margin: 0 auto; padding: var(--sp-8) var(--sp-4); }
        .dash-loading { text-align: center; padding: var(--sp-16); color: var(--col-text-muted); }
        .dash-loading--error { color: #dc2626; }

        .dash-header {
          display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap;
          gap: var(--sp-4); margin-bottom: var(--sp-8);
        }
        .dash-tagline {
          display: block; font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--col-accent); margin-bottom: var(--sp-1);
        }
        .dash-title { font-family: var(--font-heading); font-weight: 700; font-size: var(--text-2xl); color: var(--col-primary); }
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
          padding: var(--sp-4); text-decoration: none; color: inherit;
        }
        .dash-row--clickable { cursor: pointer; transition: border-color var(--tr-base), transform var(--tr-base); }
        .dash-row--clickable:hover { border-color: var(--col-primary); transform: translateX(2px); }
        .dash-row__right { display: flex; align-items: center; gap: var(--sp-3); }
        .dash-row__chevron { color: var(--col-text-muted); font-weight: 700; }
        .dash-row__meta { display: block; font-size: var(--text-xs); color: var(--col-text-muted); margin-top: 2px; }

        .dash-badge { font-size: var(--text-xs); font-weight: 700; padding: var(--sp-1) var(--sp-3); border-radius: var(--r-full); white-space: nowrap; }
        .dash-badge--pending { background: var(--col-surface2); color: var(--col-text-sec); }
        .dash-badge--accepted { background: var(--col-success-bg); color: var(--col-success); }
        .dash-badge--rejected { background: var(--col-error-bg); color: var(--col-error); }
      `}</style>
    </div>
  );
}
