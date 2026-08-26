// src/components/volunteer/TaskTypeformForm.jsx
// Assistant de soumission de tâche façon Typeform, réutilisant les mêmes
// mécaniques que VolunteerApplicationForm.jsx (palette dérivée de la
// couleur de marque, une question à la fois, progression, navigation
// clavier, étape de relecture) — décision utilisateur, 2026-08-19 :
// "le formulaire va utiliser le même style que le formulaire
// d'inscription". Réservé aux tâches dont task.displayStyle === "TYPEFORM"
// (réglage par tâche, voir VolunteerProgramEditor.jsx) — les autres
// continuent d'utiliser le formulaire compact inline de ProgramProgress.jsx.
//
// Contrairement à VolunteerApplicationForm.jsx (formulaire PUBLIC, aucun
// champ IMAGE/URL), ce composant est authentifié (volunteerFetch, comme
// tout "Mon espace") et doit gérer TOUS les types de champ de preuve
// (URL avec aperçu, IMAGE avec upload Cloudinary) — les deux ajoutés
// ici par rapport à l'assistant de candidature.
import { useEffect, useMemo, useRef, useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import { useVolunteerGuard } from "@/hooks/useVolunteerGuard";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";
const DEFAULT_BRAND_COLOR = "#1B4332";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// --- Dérivation de palette : copie exacte de VolunteerApplicationForm.jsx
// (aucun module partagé entre les deux dans ce projet, même convention que
// isFieldVisible déjà dupliquée entre ProgramProgress.jsx et ce fichier).
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function derivePalette(brandColor) {
  const base = /^#[0-9a-fA-F]{6}$/.test(brandColor || "") ? brandColor : DEFAULT_BRAND_COLOR;
  const { h, s } = hexToHsl(base);
  const satHigh = clamp(s + 10, 55, 95);
  const hueShift = h + 20;

  const gradDark = hslToHex(h, satHigh, 15);
  const gradMid = hslToHex(h, satHigh, 32);
  const gradEnd = hslToHex(hueShift, satHigh, 46);
  const accent = hslToHex(hueShift, satHigh, 68);
  const accentLight = hslToHex(hueShift, satHigh, 80);
  const [ar, ag, ab] = hexToRgb(accent);

  return {
    gradDark, gradMid, gradEnd, accent, accentLight, accentDark: "#0F172A",
    glowRgba: `rgba(${ar}, ${ag}, ${ab}, 0.28)`,
    selectedBgRgba: `rgba(${ar}, ${ag}, ${ab}, 0.35)`,
    shadowRgba: `rgba(${ar}, ${ag}, ${ab}, 0.45)`,
  };
}

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

const isEmptyValue = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
const isUrlLike = (str) => /^https?:\/\/.+/i.test(String(str || ""));

const validateStep = (step, value) => {
  const isEmpty = isEmptyValue(value);
  if (step.required && isEmpty) return false;
  if (isEmpty) return true;

  if (step.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return false;

  const v = step.validation || {};
  if (["TEXT", "TEXTAREA", "EMAIL", "PHONE"].includes(step.type)) {
    const str = String(value);
    if (v.minLength && str.length < v.minLength) return false;
    if (v.maxLength && str.length > v.maxLength) return false;
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(str)) return false;
      } catch {
        // pattern invalide côté staff : ignoré plutôt que de bloquer le volontaire
      }
    }
  }
  if (step.type === "NUMBER") {
    const num = Number(value);
    if (Number.isNaN(num)) return false;
    if (v.min !== null && v.min !== undefined && num < v.min) return false;
    if (v.max !== null && v.max !== undefined && num > v.max) return false;
  }
  if (step.type === "URL" && !isUrlLike(value)) return false;

  return true;
};

const INPUT_TYPE = { EMAIL: "email", NUMBER: "number", DATE: "date", PHONE: "tel", URL: "url" };

export default function TaskTypeformForm({ programId, taskId, occurrenceKey }) {
  const ready = useVolunteerGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programTitle, setProgramTitle] = useState("");
  const [task, setTask] = useState(null);
  const [brandColor, setBrandColor] = useState("");

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadingFieldId, setUploadingFieldId] = useState(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    volunteerFetch(`/volunteer-tasks/my-progress/${programId}`)
      .then((data) => {
        const t = (data.tasks || []).find((x) => x.id === taskId);
        if (!t) throw new Error("Tâche introuvable");
        const occ = (t.occurrences || []).find(
          (o) => (o.occurrenceDate ? new Date(o.occurrenceDate).toISOString().slice(0, 10) : "once") === (occurrenceKey || "once")
        );
        if (occ?.responses) setAnswers(occ.responses);
        setTask(t);
        setProgramTitle(data.programTitle || "");
        setBrandColor(data.brandColor || "");
      })
      .catch((err) => setError(err.message || "Tâche introuvable"))
      .finally(() => setLoading(false));
  }, [ready, programId, taskId, occurrenceKey]);

  const palette = useMemo(() => derivePalette(brandColor), [brandColor]);
  const fieldsById = useMemo(() => new Map((task?.proofFields || []).map((f) => [f.id, f])), [task]);
  const steps = useMemo(() => {
    if (!task) return [];
    return task.proofFields.filter((f) => isFieldVisible(f, answers, fieldsById));
  }, [task, answers, fieldsById]);

  const totalSteps = steps.length;
  const isReview = currentIndex === totalSteps;
  const currentStep = !isReview ? steps[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, totalSteps));
  }, [totalSteps]);

  useEffect(() => {
    setStepError("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [currentIndex, started]);

  const setValue = (value) => {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  };

  const goNext = () => {
    if (!currentStep) return;
    if (!validateStep(currentStep, answers[currentStep.id])) {
      setStepError(
        currentStep.required && isEmptyValue(answers[currentStep.id])
          ? "Cette réponse est obligatoire."
          : "Cette réponse n'est pas valide."
      );
      return;
    }
    setStepError("");
    setDirection("forward");
    setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setStepError("");
    setDirection("backward");
    setCurrentIndex((i) => i - 1);
  };

  const selectChoice = (value) => {
    setValue(value);
    setStepError("");
    setDirection("forward");
    setTimeout(() => setCurrentIndex((i) => i + 1), 320);
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
      setAnswers((prev) => {
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
    setAnswers((prev) => ({ ...prev, [fieldId]: (prev[fieldId] || []).filter((u) => u !== url) }));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      await volunteerFetch("/volunteer-tasks/submissions", {
        method: "POST",
        body: JSON.stringify({
          programId, taskId,
          occurrenceDate: occurrenceKey && occurrenceKey !== "once" ? occurrenceKey : null,
          responses: answers,
        }),
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="tf-shell tf-shell--center">
        <p className="tf-loading">Chargement...</p>
        <TaskTypeformStyles palette={derivePalette("")} />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="tf-shell tf-shell--center">
        <p className="tf-fatal-error">{error || "Tâche introuvable"}</p>
        <a href={`/mon-espace/programme/${programId}`} className="tf-btn tf-btn--ghost">← Retour</a>
        <TaskTypeformStyles palette={derivePalette("")} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="tf-shell tf-shell--center">
        <div className="tf-done">
          <svg viewBox="0 0 52 52" className="tf-check" aria-hidden="true">
            <circle className="tf-check__circle" cx="26" cy="26" r="24" fill="none" />
            <path className="tf-check__mark" fill="none" d="M14 27l7 7 16-16" />
          </svg>
          <h1 className="tf-done__title">Envoyé !</h1>
          <p className="tf-done__subtitle">
            {task.isFinalReport
              ? <>Votre rapport de fin de mission a bien été transmis pour « {programTitle} ». Vous serez informé(e) dès qu'il aura été examiné.</>
              : <>Votre réponse à « {task.title} » a bien été transmise pour « {programTitle} », en attente de validation.</>}
          </p>
          <a href={`/mon-espace/programme/${programId}`} className="tf-btn tf-btn--primary">← Retour à mon espace</a>
        </div>
        <TaskTypeformStyles palette={palette} />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="tf-shell tf-shell--center">
        <div className="tf-cover">
          {task.isFinalReport && <span className="tf-cover__badge">🏁 Rapport de fin de mission</span>}
          <h1 className="tf-cover__title">{task.title}</h1>
          {task.description && <p className="tf-cover__desc">{task.description}</p>}
          {task.dueAt && (
            <p className="tf-cover__meta">
              À soumettre avant le {new Date(task.dueAt).toLocaleString("fr-FR")}
            </p>
          )}
          <button type="button" className="tf-btn tf-btn--primary tf-btn--lg" onClick={() => setStarted(true)}>
            Commencer →
          </button>
          <a href={`/mon-espace/programme/${programId}`} className="tf-link tf-link--quit">← Retour à mon espace</a>
        </div>
        <TaskTypeformStyles palette={palette} />
      </div>
    );
  }

  const progressPercent = totalSteps === 0 ? 100 : Math.min(100, (currentIndex / totalSteps) * 100);
  const parentField = currentStep?.conditional?.fieldId ? fieldsById.get(currentStep.conditional.fieldId) : null;

  return (
    <div className="tf-shell">
      <div className="tf-progress"><div className="tf-progress__bar" style={{ width: `${progressPercent}%` }} /></div>

      <div className="tf-topbar">
        <span className="tf-topbar__count">{isReview ? "Dernière étape" : `Question ${currentIndex + 1} / ${totalSteps}`}</span>
        <a href={`/mon-espace/programme/${programId}`} className="tf-topbar__quit">✕ Quitter</a>
      </div>

      <div className="tf-stage">
        <div key={currentIndex} className={`tf-question tf-question--${direction}`}>
          {isReview ? (
            <div className="tf-review">
              <h1 className="tf-question__title">Tout est prêt !</h1>
              <p className="tf-review__desc">Vérifiez vos réponses avant l'envoi — vous pourrez resoumettre si besoin.</p>
              {submitError && <p className="tf-error" role="alert">{submitError}</p>}
              <div className="tf-nav tf-nav--review">
                <button type="button" className="tf-btn tf-btn--ghost" onClick={goPrev}>← Modifier mes réponses</button>
                <button type="button" className="tf-btn tf-btn--primary tf-btn--lg" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Envoi..." : "Envoyer →"}
                </button>
              </div>
            </div>
          ) : (
            <form className="tf-form" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
              {parentField && <p className="tf-question__hint">↳ Suite à votre réponse à « {parentField.label} »</p>}
              <h1 className="tf-question__title">
                {currentStep.label} {currentStep.required && <span className="tf-question__required">*</span>}
              </h1>

              {currentStep.type === "TEXTAREA" && (
                <textarea ref={inputRef} className="tf-textarea" rows={4} placeholder="Tapez votre réponse ici..."
                  value={answers[currentStep.id] || ""} onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); goNext(); }
                  }} />
              )}

              {currentStep.type === "SELECT" && (
                <div className="tf-choices">
                  {(currentStep.options || []).map((opt, i) => (
                    <button type="button" key={opt}
                      className={`tf-choice ${answers[currentStep.id] === opt ? "tf-choice--selected" : ""}`}
                      onClick={() => selectChoice(opt)}>
                      <span className="tf-choice__badge">{String.fromCharCode(65 + i)}</span>
                      <span className="tf-choice__label">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStep.type === "CHECKBOX" && (
                <div className="tf-choices">
                  <button type="button" className={`tf-choice ${answers[currentStep.id] === true ? "tf-choice--selected" : ""}`}
                    onClick={() => selectChoice(true)}>
                    <span className="tf-choice__badge">✓</span><span className="tf-choice__label">Oui</span>
                  </button>
                  <button type="button" className={`tf-choice ${answers[currentStep.id] === false ? "tf-choice--selected" : ""}`}
                    onClick={() => selectChoice(false)}>
                    <span className="tf-choice__badge">✕</span><span className="tf-choice__label">Non</span>
                  </button>
                </div>
              )}

              {["TEXT", "EMAIL", "PHONE", "NUMBER", "DATE", "URL"].includes(currentStep.type) && (
                <input ref={inputRef} className="tf-input" type={INPUT_TYPE[currentStep.type] || "text"}
                  placeholder={currentStep.type === "URL" ? "https://..." : "Tapez votre réponse ici..."}
                  value={answers[currentStep.id] || ""} onChange={(e) => setValue(e.target.value)} />
              )}

              {currentStep.type === "IMAGE" && (
                <div className="tf-image-field">
                  <div className="tf-image-thumbs">
                    {(answers[currentStep.id] || []).map((url) => (
                      <div key={url} className="tf-image-thumb">
                        <img src={url} alt="" />
                        <button type="button" onClick={() => removeImage(currentStep.id, url)} aria-label="Retirer">✕</button>
                      </div>
                    ))}
                  </div>
                  {(!currentStep.validation?.maxImages || (answers[currentStep.id] || []).length < currentStep.validation.maxImages) && (
                    <label className="tf-image-upload-btn">
                      {uploadingFieldId === currentStep.id ? "Envoi..." : "+ Ajouter une photo"}
                      <input type="file" accept="image/*" hidden disabled={uploadingFieldId === currentStep.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(currentStep.id, file, currentStep.validation?.maxImages);
                          e.target.value = "";
                        }} />
                    </label>
                  )}
                  {currentStep.validation?.maxImages && (
                    <span className="tf-image-limit">
                      {(answers[currentStep.id] || []).length}/{currentStep.validation.maxImages} photo(s)
                    </span>
                  )}
                </div>
              )}

              {stepError && <p className="tf-error" role="alert">{stepError}</p>}

              <div className="tf-nav">
                <button type="button" className="tf-btn tf-btn--ghost" onClick={goPrev} disabled={currentIndex === 0}>
                  ← Précédent
                </button>
                <span className="tf-nav__spacer" />
                {!["SELECT", "CHECKBOX", "IMAGE"].includes(currentStep.type) && (
                  <span className="tf-nav__hint">Appuyez sur Entrée ↵</span>
                )}
                <button type="submit" className="tf-btn tf-btn--primary">Suivant →</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <TaskTypeformStyles palette={palette} />
    </div>
  );
}

function TaskTypeformStyles({ palette }) {
  // Plein écran volontairement toujours sombre, indépendant du thème
  // clair/sombre — même raisonnement que VolunteerApplicationFormStyles
  // (couleurs de marque figées en hexadécimal, jamais var(--col-*)).
  return (
    <style>{`
      .tf-shell {
        position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
        display: flex; flex-direction: column;
        background: radial-gradient(ellipse at top right, ${palette.glowRgba}, transparent 55%),
                    linear-gradient(160deg, ${palette.gradDark} 0%, ${palette.gradMid} 55%, ${palette.gradEnd} 140%);
        color: #FFFFFF;
        font-family: var(--font-body);
        z-index: 10;
      }
      .tf-shell--center { align-items: center; justify-content: center; text-align: center; padding: var(--sp-8); gap: var(--sp-6); }

      .tf-loading, .tf-fatal-error { font-size: var(--text-lg); }

      .tf-progress { height: 4px; width: 100%; background: rgba(255,255,255,0.18); flex-shrink: 0; }
      .tf-progress__bar { height: 100%; background: ${palette.accent}; transition: width var(--tr-slow); }

      .tf-topbar { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-5) var(--sp-6); flex-shrink: 0; }
      .tf-topbar__count { font-size: var(--text-sm); color: rgba(255,255,255,0.8); }
      .tf-topbar__quit { font-size: var(--text-sm); color: rgba(255,255,255,0.8); }
      .tf-topbar__quit:hover { color: #FFFFFF; }

      .tf-stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--sp-6); }

      .tf-question { width: 100%; max-width: 38rem; }
      .tf-question--forward { animation: tf-in-forward var(--tr-slow) both; }
      .tf-question--backward { animation: tf-in-backward var(--tr-slow) both; }
      @keyframes tf-in-forward { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes tf-in-backward { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }

      .tf-question__hint { font-size: var(--text-sm); color: rgba(255,255,255,0.85); margin-bottom: var(--sp-2); }
      .tf-question__title {
        font-family: var(--font-heading); font-weight: 500; line-height: 1.25; color: #FFFFFF;
        font-size: clamp(1.5rem, 4vw, 2.25rem); margin-bottom: var(--sp-8);
      }
      .tf-question__required { color: ${palette.accentLight}; }

      .tf-input, .tf-textarea {
        width: 100%; background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.5);
        color: #FFFFFF; font-family: var(--font-body); font-size: var(--text-xl);
        padding: var(--sp-3) var(--sp-1); transition: border-color var(--tr-base);
      }
      .tf-input::placeholder, .tf-textarea::placeholder { color: rgba(255,255,255,0.45); }
      .tf-input:focus, .tf-textarea:focus { outline: none; border-color: ${palette.accent}; }
      .tf-textarea { resize: vertical; }

      .tf-choices { display: flex; flex-direction: column; gap: var(--sp-3); }
      .tf-choice {
        display: flex; align-items: center; gap: var(--sp-4);
        background: rgba(255,255,255,0.10); border: 2px solid rgba(255,255,255,0.28);
        border-radius: var(--r-md); padding: var(--sp-4) var(--sp-5);
        color: #FFFFFF; font-family: var(--font-body); font-size: var(--text-base);
        text-align: left; cursor: pointer; transition: all var(--tr-fast);
      }
      .tf-choice:hover { border-color: ${palette.accentLight}; background: rgba(255,255,255,0.16); transform: translateX(4px); }
      .tf-choice--selected { border-color: ${palette.accent}; background: ${palette.selectedBgRgba}; }
      .tf-choice__badge {
        display: flex; align-items: center; justify-content: center;
        width: 2rem; height: 2rem; border-radius: var(--r-sm); flex-shrink: 0;
        background: rgba(255,255,255,0.18); font-weight: 700; font-size: var(--text-sm);
      }
      .tf-choice--selected .tf-choice__badge { background: ${palette.accent}; color: ${palette.accentDark}; }

      .tf-image-field { display: flex; flex-direction: column; gap: var(--sp-3); align-items: flex-start; }
      .tf-image-thumbs { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
      .tf-image-thumb { position: relative; width: 5.5rem; height: 5.5rem; }
      .tf-image-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--r-md); border: 2px solid rgba(255,255,255,0.3); }
      .tf-image-thumb button {
        position: absolute; top: -6px; right: -6px; width: 1.4rem; height: 1.4rem; border-radius: 999px;
        background: #dc2626; color: #fff; border: none; font-size: 0.7rem; cursor: pointer; line-height: 1;
      }
      .tf-image-upload-btn {
        display: inline-block; background: rgba(255,255,255,0.14); color: #FFFFFF;
        border: 2px solid rgba(255,255,255,0.3); padding: var(--sp-3) var(--sp-5);
        border-radius: var(--r-md); font-weight: 600; cursor: pointer; font-size: var(--text-sm);
      }
      .tf-image-upload-btn:hover { background: rgba(255,255,255,0.22); }
      .tf-image-limit { font-size: var(--text-xs); color: rgba(255,255,255,0.7); }

      .tf-error {
        color: #FFC9C9; font-size: var(--text-sm); margin-top: var(--sp-4); font-weight: 600;
        animation: tf-shake 0.4s ease;
      }
      @keyframes tf-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

      .tf-nav { display: flex; align-items: center; flex-wrap: wrap; gap: var(--sp-3) var(--sp-4); margin-top: var(--sp-8); }
      .tf-nav--review { justify-content: space-between; flex-wrap: wrap; }
      .tf-nav__spacer { flex: 1; }
      .tf-nav__hint { font-size: var(--text-xs); color: rgba(255,255,255,0.65); }

      .tf-btn {
        display: inline-flex; align-items: center; gap: var(--sp-2);
        border-radius: var(--r-md); padding: var(--sp-3) var(--sp-6);
        font-family: var(--font-body); font-weight: 600; font-size: var(--text-base);
        cursor: pointer; border: none; transition: all var(--tr-fast); white-space: nowrap;
      }
      .tf-btn--primary { background: ${palette.accent}; color: ${palette.accentDark}; box-shadow: 0 4px 24px ${palette.shadowRgba}; }
      .tf-btn--primary:hover { background: ${palette.accentLight}; transform: translateY(-2px); }
      .tf-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .tf-btn--ghost { background: transparent; color: rgba(255,255,255,0.9); border: 2px solid rgba(255,255,255,0.4); }
      .tf-btn--ghost:hover { border-color: rgba(255,255,255,0.65); color: #FFFFFF; background: rgba(255,255,255,0.06); }
      .tf-btn--ghost:disabled { opacity: 0.35; cursor: not-allowed; }
      .tf-btn--lg { padding: var(--sp-4) var(--sp-8); font-size: var(--text-lg); }

      .tf-link {
        background: none; border: none; padding: 0; cursor: pointer; text-decoration: none;
        color: ${palette.accentLight}; font-family: var(--font-body); font-size: var(--text-sm);
        font-weight: 600;
      }
      .tf-link:hover { color: #FFFFFF; }
      .tf-link--quit { margin-top: var(--sp-6); }

      .tf-cover { max-width: 34rem; display: flex; flex-direction: column; align-items: center; }
      .tf-cover__badge {
        display: inline-block; background: rgba(255,255,255,0.16); color: #FFFFFF;
        border: 1px solid rgba(255,255,255,0.3); border-radius: var(--r-full); padding: var(--sp-1) var(--sp-4);
        font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--sp-5);
      }
      .tf-cover__title {
        font-family: var(--font-heading); font-weight: 500; font-size: clamp(1.75rem, 5vw, 2.75rem);
        margin-bottom: var(--sp-4); line-height: 1.2; color: #FFFFFF;
      }
      .tf-cover__desc { color: rgba(255,255,255,0.9); font-size: var(--text-lg); margin-bottom: var(--sp-3); white-space: pre-line; }
      .tf-cover__meta { color: rgba(255,255,255,0.7); font-size: var(--text-sm); margin-bottom: var(--sp-8); }

      .tf-review__desc { color: rgba(255,255,255,0.88); font-size: var(--text-lg); margin-bottom: var(--sp-6); }

      .tf-done { max-width: 30rem; display: flex; flex-direction: column; align-items: center; }
      .tf-check { width: 4.5rem; height: 4.5rem; margin-bottom: var(--sp-6); }
      .tf-check__circle { stroke: ${palette.accent}; stroke-width: 2; stroke-dasharray: 151; stroke-dashoffset: 151; animation: tf-draw-circle 0.6s ease forwards; }
      .tf-check__mark { stroke: #FFFFFF; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 40; stroke-dashoffset: 40; animation: tf-draw-mark 0.4s 0.6s ease forwards; }
      @keyframes tf-draw-circle { to { stroke-dashoffset: 0; } }
      @keyframes tf-draw-mark { to { stroke-dashoffset: 0; } }
      .tf-done__title { font-family: var(--font-heading); font-weight: 500; font-size: var(--text-3xl); margin-bottom: var(--sp-4); color: #FFFFFF; }
      .tf-done__subtitle { color: rgba(255,255,255,0.88); font-size: var(--text-base); margin-bottom: var(--sp-8); }

      @media (max-width: 640px) {
        .tf-topbar { padding: var(--sp-4); }
        .tf-stage { padding: var(--sp-4); align-items: flex-start; padding-top: var(--sp-12); }
        .tf-nav__hint { display: none; }
        .tf-btn { padding: var(--sp-3) var(--sp-4); }
        .tf-btn--lg { padding: var(--sp-3) var(--sp-6); }
      }

      @media (prefers-reduced-motion: reduce) {
        .tf-question--forward, .tf-question--backward { animation: none; }
        .tf-check__circle, .tf-check__mark { animation: none; stroke-dashoffset: 0; }
        .tf-error { animation: none; }
      }
    `}</style>
  );
}
