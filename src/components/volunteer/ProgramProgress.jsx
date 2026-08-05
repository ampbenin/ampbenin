import { useEffect, useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import { useVolunteerGuard } from "@/hooks/useVolunteerGuard";

const RECURRENCE_LABELS = { ONCE: "Une fois", DAILY: "Quotidienne", WEEKLY: "Hebdomadaire" };
const STATUS_LABELS = { TODO: "À faire", PENDING: "En attente de validation", APPROVED: "Validée", REJECTED: "Rejetée — à refaire" };
const STATUS_CLASS = { TODO: "pp-badge--todo", PENDING: "pp-badge--pending", APPROVED: "pp-badge--approved", REJECTED: "pp-badge--rejected" };
const MISSION_STATUS_CLASS = {
  "Non disponible": "pp-badge--todo",
  "Refusé": "pp-badge--rejected",
  "Mission validée": "pp-badge--approved",
};

export default function ProgramProgress({ programId }) {
  const ready = useVolunteerGuard();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const load = async () => {
    try {
      const result = await volunteerFetch(`/volunteer-tasks/my-progress/${programId}`);
      setData(result);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const occurrenceKey = (taskId, occurrenceDate) => `${taskId}|${occurrenceDate || "once"}`;

  const openSubmitForm = (taskId, occurrenceDate) => {
    setOpenKey(occurrenceKey(taskId, occurrenceDate));
    setProofText("");
    setProofUrl("");
    setSubmitError("");
  };

  const submit = async (taskId, occurrenceDate) => {
    if (!proofText.trim() && !proofUrl.trim()) {
      setSubmitError("Merci de fournir une preuve (texte ou lien).");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await volunteerFetch("/volunteer-tasks/submissions", {
        method: "POST",
        body: JSON.stringify({ programId, taskId, occurrenceDate, proofText, proofUrl }),
      });
      setOpenKey(null);
      load();
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loading) return <p className="pp-loading">Chargement...</p>;
  if (error || !data) return <p className="pp-loading pp-loading--error">{error || "Programme introuvable"}</p>;

  const { progress } = data;

  return (
    <div className="pp">
      <a href="/mon-espace" className="pp-back">← Retour à mon espace</a>

      <div className="pp-header">
        <span className="pp-tagline">Programme de volontariat</span>
        <h1 className="pp-title">{data.programTitle}</h1>
        <span className={`pp-badge ${MISSION_STATUS_CLASS[data.missionStatus] || "pp-badge--todo"}`}>
          {data.missionStatus}
        </span>
      </div>

      <div className="pp-progress">
        <div className="pp-progress__bar-track">
          <div className="pp-progress__bar-fill" style={{ width: `${Math.min(100, progress.percent)}%` }} />
        </div>
        <p className="pp-progress__label">
          {progress.approved}/{progress.totalDue} tâches validées ({progress.percent}%) — seuil de validation de la
          mission : {data.missionValidationThreshold}%
        </p>
      </div>

      {data.tasks.length === 0 ? (
        <p className="pp-empty">Aucune tâche définie pour ce programme pour l'instant.</p>
      ) : (
        <div className="pp-tasks">
          {data.tasks.map((task) => (
            <div key={task.id} className="pp-task">
              <div className="pp-task__head">
                <strong>{task.title}</strong>
                <span className="pp-task__recurrence">{RECURRENCE_LABELS[task.recurrence]}</span>
              </div>
              {task.description && <p className="pp-task__desc">{task.description}</p>}

              <div className="pp-occurrences">
                {[...task.occurrences].reverse().map((occ) => {
                  const key = occurrenceKey(task.id, occ.occurrenceDate);
                  const canSubmit = occ.status === "TODO" || occ.status === "REJECTED";
                  return (
                    <div key={key} className="pp-occurrence">
                      <div className="pp-occurrence__row">
                        {occ.occurrenceDate && (
                          <span className="pp-occurrence__date">
                            {new Date(occ.occurrenceDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        <span className={`pp-badge ${STATUS_CLASS[occ.status]}`}>{STATUS_LABELS[occ.status]}</span>
                        {canSubmit && openKey !== key && (
                          <button
                            className="pp-link-btn"
                            onClick={() => openSubmitForm(task.id, occ.occurrenceDate)}
                          >
                            {occ.status === "REJECTED" ? "Resoumettre →" : "Soumettre →"}
                          </button>
                        )}
                      </div>

                      {occ.status === "REJECTED" && occ.reviewNote && (
                        <p className="pp-occurrence__note">Motif du rejet : {occ.reviewNote}</p>
                      )}

                      {openKey === key && (
                        <div className="pp-submit-form">
                          {submitError && <p className="pp-error">{submitError}</p>}
                          <textarea
                            placeholder="Décrivez ce que vous avez fait..."
                            rows={3}
                            value={proofText}
                            onChange={(e) => setProofText(e.target.value)}
                            className="pp-input"
                          />
                          <input
                            type="url"
                            placeholder="Lien vers une preuve (photo, document...) — optionnel"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            className="pp-input"
                          />
                          <div className="pp-submit-form__actions">
                            <button
                              className="pp-btn pp-btn--ghost"
                              onClick={() => setOpenKey(null)}
                              disabled={submitting}
                            >
                              Annuler
                            </button>
                            <button
                              className="pp-btn pp-btn--primary"
                              onClick={() => submit(task.id, occ.occurrenceDate)}
                              disabled={submitting}
                            >
                              {submitting ? "Envoi..." : "Envoyer la preuve"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .pp { max-width: 42rem; margin: 0 auto; padding: var(--sp-8) var(--sp-4); }
        .pp-loading { text-align: center; padding: var(--sp-16); color: var(--col-text-muted); }
        .pp-loading--error { color: #dc2626; }
        .pp-back { display: inline-block; font-size: var(--text-sm); color: var(--col-primary); font-weight: 600; margin-bottom: var(--sp-6); text-decoration: none; }
        .pp-back:hover { text-decoration: underline; }

        .pp-header { margin-bottom: var(--sp-6); }
        .pp-tagline {
          display: block; font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--col-accent); margin-bottom: var(--sp-1);
        }
        .pp-title { font-family: var(--font-heading); font-weight: 700; font-size: var(--text-2xl); color: var(--col-primary); margin-bottom: var(--sp-2); }

        .pp-progress { margin-bottom: var(--sp-8); }
        .pp-progress__bar-track { height: 10px; background: var(--col-surface2); border-radius: var(--r-full); overflow: hidden; margin-bottom: var(--sp-2); }
        .pp-progress__bar-fill { height: 100%; background: var(--col-primary); transition: width var(--tr-slow); }
        .pp-progress__label { font-size: var(--text-sm); color: var(--col-text-sec); }

        .pp-empty { color: var(--col-text-muted); }

        .pp-tasks { display: flex; flex-direction: column; gap: var(--sp-5); }
        .pp-task {
          background: var(--col-white); border: 1px solid var(--col-border-light); border-radius: var(--r-lg);
          padding: var(--sp-5);
        }
        .pp-task__head { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; margin-bottom: var(--sp-1); }
        .pp-task__recurrence {
          font-size: var(--text-xs); font-weight: 700; color: var(--col-accent-xdark); background: var(--col-accent-bg);
          padding: 2px var(--sp-3); border-radius: var(--r-full);
        }
        .pp-task__desc { font-size: var(--text-sm); color: var(--col-text-sec); margin-bottom: var(--sp-3); }

        .pp-occurrences { display: flex; flex-direction: column; gap: var(--sp-3); }
        .pp-occurrence { border-top: 1px solid var(--col-border-light); padding-top: var(--sp-3); }
        .pp-occurrence:first-child { border-top: none; padding-top: 0; }
        .pp-occurrence__row { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
        .pp-occurrence__date { font-size: var(--text-sm); font-weight: 600; color: var(--col-text); min-width: 4rem; }
        .pp-occurrence__note { font-size: var(--text-xs); color: #dc2626; margin-top: var(--sp-1); }

        .pp-badge { font-size: var(--text-xs); font-weight: 700; padding: var(--sp-1) var(--sp-3); border-radius: var(--r-full); white-space: nowrap; }
        .pp-badge--todo { background: var(--col-surface2); color: var(--col-text-sec); }
        .pp-badge--pending { background: rgba(245,158,11,0.12); color: var(--col-warning); }
        .pp-badge--approved { background: var(--col-success-bg); color: var(--col-success); }
        .pp-badge--rejected { background: var(--col-error-bg); color: var(--col-error); }

        .pp-link-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--col-primary); font-weight: 600; font-size: var(--text-sm); }
        .pp-link-btn:hover { text-decoration: underline; }

        .pp-submit-form { margin-top: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); }
        .pp-input {
          width: 100%; padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--col-border); border-radius: var(--r-md);
          font-family: var(--font-body); font-size: var(--text-sm); color: var(--col-text); outline: none;
        }
        .pp-input:focus { border-color: var(--col-primary); }
        .pp-error { color: #dc2626; font-size: var(--text-sm); font-weight: 600; }
        .pp-submit-form__actions { display: flex; gap: var(--sp-2); justify-content: flex-end; }

        .pp-btn { padding: var(--sp-2) var(--sp-4); border-radius: var(--r-md); font-weight: 700; font-size: var(--text-sm); cursor: pointer; border: none; }
        .pp-btn--primary { background: var(--col-primary); color: var(--col-white); }
        .pp-btn--primary:hover:not(:disabled) { background: var(--col-primary-light); }
        .pp-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .pp-btn--ghost { background: var(--col-surface2); color: var(--col-text-sec); }
        .pp-btn--ghost:hover:not(:disabled) { background: var(--col-border); }
      `}</style>
    </div>
  );
}
