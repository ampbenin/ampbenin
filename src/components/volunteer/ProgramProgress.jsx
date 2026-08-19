import { useEffect, useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import { useVolunteerGuard } from "@/hooks/useVolunteerGuard";
import { useTheme } from "@/hooks/useTheme";
import { formatSmartTime } from "@/utils/formatSmartTime.js";
import TruncatedDescription from "@/components/shared/TruncatedDescription.jsx";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton.jsx";
import LoadingSpinner from "@/components/shared/LoadingSpinner.jsx";

const RECURRENCE_LABELS = { ONCE: "Une fois", DAILY: "Quotidienne", WEEKLY: "Hebdomadaire" };
const STATUS_LABELS = { TODO: "À faire", PENDING: "En attente de validation", APPROVED: "Validée", REJECTED: "Rejetée — à refaire" };
const STATUS_CLASS = { TODO: "pp-badge--todo", PENDING: "pp-badge--pending", APPROVED: "pp-badge--approved", REJECTED: "pp-badge--rejected" };
const MISSION_STATUS_CLASS = {
  "Non disponible": "pp-badge--todo",
  "Refusé": "pp-badge--rejected",
  "Mission validée": "pp-badge--approved",
};

// Vrai tableau de bord à onglets (décision utilisateur, 2026-08-18) — cette
// page empilait jusqu'ici tout d'un coup (toutes les tâches, toutes leurs
// échéances) sans séparation, illisible dès qu'une tâche quotidienne
// s'accumule sur plusieurs semaines.
const DASHBOARD_TABS = [
  { value: "overview", label: "Vue d'ensemble" },
  { value: "tasks", label: "Mes tâches" },
];
// Filtre par statut des échéances (onglet "Mes tâches") — "À faire" par
// défaut, ce qui intéresse le volontaire au quotidien ; le reste sert à
// retrouver l'historique.
const OCCURRENCE_FILTERS = [
  { value: "TODO", label: "À faire" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Validées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "", label: "Toutes" },
];

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

const isUrlLike = (str) => /^https?:\/\/.+/i.test(String(str || ""));

// Sous-champs conditionnels du formulaire de preuve (voir
// VolunteerProgramEditor.jsx, onglet Tâches) — copie exacte de la même
// fonction dans VolunteerApplicationForm.jsx (formulaire de candidature),
// pas de module partagé entre les deux côté frontend dans ce projet.
const isFieldVisible = (field, answers, fieldsById, guard = new Set()) => {
  if (!field.conditional?.fieldId) return true;
  if (guard.has(field.id)) return false;

  const parent = fieldsById.get(field.conditional.fieldId);
  if (!parent) return false;

  guard.add(field.id);
  if (!isFieldVisible(parent, answers, fieldsById, guard)) return false;

  const rawParentValue = answers[parent.id];
  const parentValueStr = typeof rawParentValue === "boolean" ? String(rawParentValue) : (rawParentValue ?? "");
  return (field.conditional.values || []).includes(parentValueStr);
};

export default function ProgramProgress({ programId }) {
  const ready = useVolunteerGuard();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [occurrenceFilter, setOccurrenceFilter] = useState("TODO");
  const [openKey, setOpenKey] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadingFieldId, setUploadingFieldId] = useState(null);

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

  const openSubmitForm = (taskId, occurrenceDate, existingResponses) => {
    setOpenKey(occurrenceKey(taskId, occurrenceDate));
    setResponses({ ...(existingResponses || {}) });
    setSubmitError("");
  };

  const setFieldValue = (fieldId, value) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const uploadImage = async (fieldId, file, maxImages) => {
    setUploadingFieldId(fieldId);
    setSubmitError("");
    try {
      const token = localStorage.getItem("volunteer_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/volunteer-tasks/upload-proof-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploaded = await res.json();
      if (!res.ok) throw new Error(uploaded.message || "Erreur lors de l'upload de l'image");

      setResponses((prev) => {
        const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
        if (maxImages && current.length >= maxImages) return prev;
        return { ...prev, [fieldId]: [...current, uploaded.url] };
      });
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de l'upload de l'image");
    } finally {
      setUploadingFieldId(null);
    }
  };

  const removeImage = (fieldId, url) => {
    setResponses((prev) => ({ ...prev, [fieldId]: (prev[fieldId] || []).filter((u) => u !== url) }));
  };

  const submit = async (taskId, occurrenceDate) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await volunteerFetch("/volunteer-tasks/submissions", {
        method: "POST",
        body: JSON.stringify({ programId, taskId, occurrenceDate, responses }),
      });
      setOpenKey(null);
      load();
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loading) return <LoadingSpinner />;
  if (error || !data) return <LoadingSpinner message={error || "Programme introuvable"} error />;

  const { progress } = data;

  // Compte des échéances par statut, toutes tâches confondues — donne du
  // contenu concret à "Vue d'ensemble" en plus de la barre de progression.
  const occurrenceCounts = { TODO: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  data.tasks.forEach((task) => {
    task.occurrences.forEach((occ) => {
      occurrenceCounts[occ.status] = (occurrenceCounts[occ.status] || 0) + 1;
    });
  });

  // "Mes tâches" filtré par statut d'échéance (décision utilisateur,
  // 2026-08-18) — une tâche sans aucune échéance correspondant au filtre
  // actif disparaît entièrement (jamais une carte vide affichée pour rien).
  const filteredTasks = data.tasks
    .map((task) => ({
      ...task,
      occurrences: occurrenceFilter ? task.occurrences.filter((occ) => occ.status === occurrenceFilter) : task.occurrences,
    }))
    .filter((task) => task.occurrences.length > 0);

  return (
    <div className="pp" data-theme={theme}>
    <div className="pp-inner">
      <div className="pp-topbar">
        <a href="/mon-espace" className="pp-back">← Retour à mon espace</a>
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="pp-header">
        <span className="pp-tagline">Programme de volontariat</span>
        <h1 className="pp-title">{data.programTitle}</h1>
        <span className={`pp-badge ${MISSION_STATUS_CLASS[data.missionStatus] || "pp-badge--todo"}`}>
          {data.missionStatus}
        </span>
      </div>

      <div className="pp-tabs">
        {DASHBOARD_TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setActiveTab(t.value)}
            className={`pp-tab ${activeTab === t.value ? "pp-tab--active" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          <div className="pp-progress">
            <div className="pp-progress__bar-track">
              <div className="pp-progress__bar-fill" style={{ width: `${Math.min(100, progress.percent)}%` }} />
            </div>
            <p className="pp-progress__label">
              {progress.approved}/{progress.totalDue} tâches validées ({progress.percent}%) — seuil de validation de la
              mission : {data.missionValidationThreshold}%
            </p>
          </div>

          <div className="pp-stats">
            {OCCURRENCE_FILTERS.filter((f) => f.value).map((f) => (
              <div key={f.value} className="pp-stat">
                <div className="pp-stat__value">{occurrenceCounts[f.value] || 0}</div>
                <div className="pp-stat__label">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
      <div>
      <div className="pp-tabs pp-tabs--sub">
        {OCCURRENCE_FILTERS.map((f) => (
          <button key={f.value || "ALL"} type="button" onClick={() => setOccurrenceFilter(f.value)}
            className={`pp-tab pp-tab--sub ${occurrenceFilter === f.value ? "pp-tab--active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      {data.tasks.length === 0 ? (
        <p className="pp-empty">Aucune tâche définie pour ce programme pour l'instant.</p>
      ) : filteredTasks.length === 0 ? (
        <p className="pp-empty">Aucune tâche ne correspond à ce filtre.</p>
      ) : (
        <div className="pp-tasks">
          {filteredTasks.map((task) => {
            const proofFieldsById = new Map((task.proofFields || []).map((f) => [f.id, f]));
            return (
            <div key={task.id} className="pp-task">
              <div className="pp-task__head">
                <strong>{task.title}</strong>
                <span className="pp-task__recurrence">{RECURRENCE_LABELS[task.recurrence]}</span>
              </div>
              {task.description && (
                <div className="pp-task__desc">
                  <TruncatedDescription
                    text={task.description}
                    title={task.title}
                    times={[
                      { label: "Publiée", value: task.publishedAt ? formatSmartTime(task.publishedAt) : "—" },
                      ...(task.dueAt ? [{ label: "Fermeture", value: formatSmartTime(task.dueAt) }] : []),
                    ]}
                  />
                </div>
              )}
              <p className="pp-task__times">
                Publiée : {task.publishedAt ? formatSmartTime(task.publishedAt) : "—"}
                {task.dueAt && <> · Fermeture : {formatSmartTime(task.dueAt)}</>}
              </p>

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
                            onClick={() => openSubmitForm(task.id, occ.occurrenceDate, occ.responses)}
                          >
                            {occ.status === "REJECTED" ? "Resoumettre →" : "Soumettre →"}
                          </button>
                        )}
                      </div>

                      {occ.submittedAt && (occ.status === "PENDING" || occ.status === "APPROVED" || occ.status === "REJECTED") && (
                        <p className="pp-occurrence__submitted">
                          Soumise : {formatSmartTime(occ.submittedAt)}
                          {occ.status !== "PENDING" && occ.reviewedAt && (
                            <> · {occ.status === "APPROVED" ? "Validée" : "Rejetée"} : {formatSmartTime(occ.reviewedAt)}</>
                          )}
                        </p>
                      )}

                      {occ.status === "REJECTED" && occ.reviewNote && (
                        <p className="pp-occurrence__note">Motif du rejet : {occ.reviewNote}</p>
                      )}

                      {openKey === key && (
                        <div className="pp-submit-form">
                          {submitError && <p className="pp-error">{submitError}</p>}

                          {task.proofFields
                            .filter((field) => isFieldVisible(field, responses, proofFieldsById))
                            .map((field) => (
                            <div key={field.id} className="pp-field">
                              <label className="pp-field__label">
                                {field.label} {field.required && <span className="pp-field__required">*</span>}
                              </label>

                              {field.type === "TEXTAREA" && (
                                <textarea rows={3} className="pp-input" value={responses[field.id] || ""}
                                  onChange={(e) => setFieldValue(field.id, e.target.value)} />
                              )}

                              {["TEXT", "EMAIL", "PHONE"].includes(field.type) && (
                                <input type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : "text"}
                                  className="pp-input" value={responses[field.id] || ""}
                                  onChange={(e) => setFieldValue(field.id, e.target.value)} />
                              )}

                              {field.type === "NUMBER" && (
                                <input type="number" className="pp-input" value={responses[field.id] ?? ""}
                                  onChange={(e) => setFieldValue(field.id, e.target.value)} />
                              )}

                              {field.type === "DATE" && (
                                <input type="date" className="pp-input" value={responses[field.id] || ""}
                                  onChange={(e) => setFieldValue(field.id, e.target.value)} />
                              )}

                              {field.type === "SELECT" && (
                                <select className="pp-input" value={responses[field.id] || ""}
                                  onChange={(e) => setFieldValue(field.id, e.target.value)}>
                                  <option value="">-- Choisir --</option>
                                  {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              )}

                              {field.type === "CHECKBOX" && (
                                <label className="pp-checkbox">
                                  <input type="checkbox" checked={!!responses[field.id]}
                                    onChange={(e) => setFieldValue(field.id, e.target.checked)} />
                                  Oui
                                </label>
                              )}

                              {field.type === "URL" && (
                                <>
                                  <input type="url" className="pp-input" placeholder="https://..."
                                    value={responses[field.id] || ""}
                                    onChange={(e) => setFieldValue(field.id, e.target.value)} />
                                  {isUrlLike(responses[field.id]) && (
                                    <a href={responses[field.id]} target="_blank" rel="noreferrer" className="pp-url-preview">
                                      {responses[field.id]}
                                    </a>
                                  )}
                                </>
                              )}

                              {field.type === "IMAGE" && (
                                <div className="pp-image-field">
                                  <div className="pp-image-thumbs">
                                    {(responses[field.id] || []).map((url) => (
                                      <div key={url} className="pp-image-thumb">
                                        <img src={url} alt="" />
                                        <button type="button" onClick={() => removeImage(field.id, url)} aria-label="Retirer">✕</button>
                                      </div>
                                    ))}
                                  </div>
                                  {(!field.validation?.maxImages || (responses[field.id] || []).length < field.validation.maxImages) && (
                                    <label className="pp-image-upload-btn">
                                      {uploadingFieldId === field.id ? "Envoi..." : "+ Ajouter une photo"}
                                      <input type="file" accept="image/*" hidden disabled={uploadingFieldId === field.id}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) uploadImage(field.id, file, field.validation?.maxImages);
                                          e.target.value = "";
                                        }} />
                                    </label>
                                  )}
                                  {field.validation?.maxImages && (
                                    <span className="pp-image-limit">
                                      {(responses[field.id] || []).length}/{field.validation.maxImages} photo(s)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

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
                              disabled={submitting || uploadingFieldId !== null}
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
            );
          })}
        </div>
      )}
      </div>
      )}
    </div>

      <style>{`
        /* .pp occupe TOUTE la largeur de l'écran (le fond thème va donc
           jusqu'aux bords, plus de "cadre" clair visible autour en mode
           sombre — signalé le 2026-08-18) ; .pp-inner recentre juste le
           contenu à une largeur confortable à lire, sans jamais limiter le
           fond. */
        .pp {
          width: 100%; background: var(--col-bg); color: var(--col-text); min-height: 100vh;
          transition: background var(--tr-base), color var(--tr-base);
          overflow-x: hidden; /* filet de sécurité — rien ne doit jamais faire défiler la page horizontalement */
        }
        .pp-inner { max-width: 56rem; margin: 0 auto; padding: var(--sp-8) var(--sp-4); }
        .pp-loading { text-align: center; padding: var(--sp-16); color: var(--col-text-muted); }
        .pp-loading--error { color: #dc2626; }
        .pp[data-theme="dark"] .pp-loading--error { color: #fca5a5; }
        .pp-topbar { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin-bottom: var(--sp-6); }
        .pp-back { display: inline-block; font-size: var(--text-sm); color: var(--col-primary); font-weight: 600; text-decoration: none; }
        .pp-back:hover { text-decoration: underline; }

        /* Mode sombre — scopé à CETTE page uniquement (décision utilisateur,
           2026-08-18 : jamais le reste du site, voir src/hooks/useTheme.js).
           body[data-theme="dark"] en plus de .pp[data-theme="dark"]
           (signalé le 2026-08-19) : permet à Header.astro (hors de l'arbre
           React) d'hériter les mêmes tokens var(--col-*). */
        body[data-theme="dark"], .pp[data-theme="dark"] {
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
          --col-accent-xdark: #E8C47A;
          --col-success: #74C69D;
          --col-success-bg: rgba(64, 145, 108, 0.22);
          --col-error: #FCA5A5;
          --col-error-bg: rgba(193, 18, 31, 0.24);
          --col-warning: #FBBF24;
        }

        .pp-header { margin-bottom: var(--sp-6); }
        .pp-tagline {
          display: block; font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--col-accent); margin-bottom: var(--sp-1);
        }
        .pp-title { font-family: var(--font-heading); font-weight: 700; font-size: var(--text-2xl); color: var(--col-primary); margin-bottom: var(--sp-2); overflow-wrap: anywhere; }

        .pp-tabs { display: flex; gap: var(--sp-1); border-bottom: 2px solid var(--col-border-light); margin-bottom: var(--sp-6); flex-wrap: wrap; }
        .pp-tab {
          background: none; border: none; cursor: pointer; padding: var(--sp-3) var(--sp-4); font-size: var(--text-sm);
          font-weight: 600; color: var(--col-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px;
          font-family: var(--font-body);
        }
        .pp-tab--active { color: var(--col-primary); border-bottom-color: var(--col-primary); }
        .pp-tabs--sub { border-bottom: none; margin-bottom: var(--sp-4); gap: var(--sp-2); }
        .pp-tab--sub {
          border: 1px solid var(--col-border); border-radius: var(--r-full); padding: var(--sp-1) var(--sp-4);
          font-size: var(--text-xs); margin-bottom: 0;
        }
        .pp-tab--sub.pp-tab--active { background: var(--col-primary); color: var(--col-white); border-color: var(--col-primary); }

        .pp-progress { margin-bottom: var(--sp-6); }
        .pp-progress__bar-track { height: 10px; background: var(--col-surface2); border-radius: var(--r-full); overflow: hidden; margin-bottom: var(--sp-2); }
        .pp-progress__bar-fill { height: 100%; background: var(--col-primary); transition: width var(--tr-slow); }
        .pp-progress__label { font-size: var(--text-sm); color: var(--col-text-sec); }

        .pp-stats { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
        .pp-stat {
          background: var(--col-white); border: 1px solid var(--col-border-light); border-radius: var(--r-lg);
          padding: var(--sp-4) var(--sp-5); min-width: 7rem;
        }
        .pp-stat__value { font-family: var(--font-heading); font-weight: 800; font-size: var(--text-2xl); color: var(--col-primary); }
        .pp-stat__label { font-size: var(--text-xs); color: var(--col-text-muted); }

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
        .pp-task__times { font-size: var(--text-xs); color: var(--col-text-muted); margin-bottom: var(--sp-3); }

        .pp-occurrences { display: flex; flex-direction: column; gap: var(--sp-3); }
        .pp-occurrence { border-top: 1px solid var(--col-border-light); padding-top: var(--sp-3); }
        .pp-occurrence:first-child { border-top: none; padding-top: 0; }
        .pp-occurrence__row { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
        .pp-occurrence__date { font-size: var(--text-sm); font-weight: 600; color: var(--col-text); min-width: 4rem; }
        .pp-occurrence__note { font-size: var(--text-xs); color: #dc2626; margin-top: var(--sp-1); }
        .pp-occurrence__submitted { font-size: var(--text-xs); color: var(--col-text-muted); margin-top: var(--sp-1); }

        .pp-badge { font-size: var(--text-xs); font-weight: 700; padding: var(--sp-1) var(--sp-3); border-radius: var(--r-full); white-space: nowrap; }
        .pp-badge--todo { background: var(--col-surface2); color: var(--col-text-sec); }
        .pp-badge--pending { background: rgba(245,158,11,0.12); color: var(--col-warning); }
        .pp-badge--approved { background: var(--col-success-bg); color: var(--col-success); }
        .pp-badge--rejected { background: var(--col-error-bg); color: var(--col-error); }

        .pp-link-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--col-primary); font-weight: 600; font-size: var(--text-sm); }
        .pp-link-btn:hover { text-decoration: underline; }

        .pp-submit-form { margin-top: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3); }
        .pp-field { display: flex; flex-direction: column; gap: var(--sp-1); }
        .pp-field__label { font-size: var(--text-sm); font-weight: 600; color: var(--col-text); }
        .pp-field__required { color: #dc2626; }
        .pp-input {
          width: 100%; padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--col-border); border-radius: var(--r-md);
          font-family: var(--font-body); font-size: var(--text-sm); color: var(--col-text); outline: none;
          /* Signalé le 2026-08-19 : "les champs du formulaire de tâche ne
             sont pas lisibles" en mode sombre — color s'adaptait déjà via
             var(--col-text) mais background restait le blanc par défaut
             du navigateur (jamais fixé explicitement) => texte clair sur
             fond resté blanc. */
          background: var(--col-surface);
        }
        .pp-input:focus { border-color: var(--col-primary); }
        .pp-checkbox { display: flex; align-items: center; gap: var(--sp-2); font-size: var(--text-sm); }
        .pp-url-preview { font-size: var(--text-xs); color: var(--col-primary); word-break: break-all; }
        .pp-error { color: #dc2626; font-size: var(--text-sm); font-weight: 600; }
        .pp-submit-form__actions { display: flex; gap: var(--sp-2); justify-content: flex-end; }

        .pp-image-field { display: flex; flex-direction: column; gap: var(--sp-2); }
        .pp-image-thumbs { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
        .pp-image-thumb { position: relative; width: 4.5rem; height: 4.5rem; }
        .pp-image-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-md); border: 1px solid var(--col-border); }
        .pp-image-thumb button {
          position: absolute; top: -6px; right: -6px; width: 1.25rem; height: 1.25rem; border-radius: 999px;
          background: #dc2626; color: #fff; border: none; font-size: 0.65rem; cursor: pointer; line-height: 1;
        }
        .pp-image-upload-btn {
          display: inline-block; align-self: flex-start; background: var(--col-surface2); color: var(--col-text);
          padding: var(--sp-2) var(--sp-4); border-radius: var(--r-md); font-size: var(--text-sm); font-weight: 600; cursor: pointer;
        }
        .pp-image-upload-btn:hover { background: var(--col-border); }
        .pp-image-limit { font-size: var(--text-xs); color: var(--col-text-muted); }

        .pp-btn { padding: var(--sp-2) var(--sp-4); border-radius: var(--r-md); font-weight: 700; font-size: var(--text-sm); cursor: pointer; border: none; }
        .pp-btn--primary { background: var(--col-primary); color: var(--col-white); }
        .pp-btn--primary:hover:not(:disabled) { background: var(--col-primary-light); }
        .pp-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .pp-btn--ghost { background: var(--col-surface2); color: var(--col-text-sec); }
        .pp-btn--ghost:hover:not(:disabled) { background: var(--col-border); }

        /* 100% responsive mobile (décision utilisateur, 2026-08-18) */
        @media (max-width: 640px) {
          .pp-inner { padding: var(--sp-5) var(--sp-3); }
          .pp-title { font-size: var(--text-xl); }
          /* Signalé le 2026-08-19 : "une barre de scroll de gauche vers
             droite alors qu'il y a plus rien à défiler" — overflow-x:auto
             + flex-wrap:nowrap forçait une seule ligne, et le moindre
             sous-pixel de dépassement (gap/bordures) faisait apparaître
             une barre de défilement quasi inutilisable (1-2px de
             course réelle). Les filtres ("À faire"/"Validées"/...) sont
             courts et se lisent très bien sur 2 lignes — on laisse
             .pp-tabs revenir à son flex-wrap:wrap de base plutôt que de
             forcer un défilement horizontal fantôme. */
          .pp-occurrence__row { align-items: flex-start; }
          .pp-submit-form__actions { flex-direction: column-reverse; }
          .pp-submit-form__actions .pp-btn { width: 100%; }
          .pp-stats { justify-content: space-between; }
          .pp-stat { flex: 1 1 40%; min-width: 0; }
        }
      `}</style>
    </div>
  );
}
