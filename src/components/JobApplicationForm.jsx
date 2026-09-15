// src/components/JobApplicationForm.jsx
// Assistant de candidature façon Typeform pour les offres de recrutement
// (JobPosting) — adapté de VolunteerApplicationForm.jsx (même mécanique de
// pas-à-pas, champs conditionnels, validation), mais formulaire d'une seule
// offre (pas de mode "spontané"), sans couleur de marque personnalisable
// (JobPosting n'a pas de brandColor comme VolunteerProgram) ni de détails
// de programme (dates, lieu...) — juste le titre + la durée estimée.
import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";
const BRAND_COLOR = "#1B4332"; // vert AMP Bénin, fixe (pas de personnalisation par offre)
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

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

function derivePalette(base) {
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
    gradDark, gradMid, gradEnd, accent, accentLight,
    accentDark: "#0F172A",
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

const isEmptyValue = (v) => v === undefined || v === null || v === "";

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
        // pattern invalide côté staff : ignoré plutôt que de bloquer le candidat
      }
    }
  }

  if (step.type === "NUMBER") {
    const num = Number(value);
    if (Number.isNaN(num)) return false;
    if (v.min !== null && v.min !== undefined && num < v.min) return false;
    if (v.max !== null && v.max !== undefined && num > v.max) return false;
  }

  return true;
};

const INPUT_TYPE = { EMAIL: "email", NUMBER: "number", DATE: "date", PHONE: "tel" };
const palette = derivePalette(BRAND_COLOR);

export default function JobApplicationForm({ jobPostingId }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/job-applications/form/${jobPostingId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Offre introuvable");
        return data;
      })
      .then((data) => setForm(data))
      .catch((err) => setError(err.message || "Offre introuvable"))
      .finally(() => setLoading(false));
  }, [jobPostingId]);

  const fieldsById = useMemo(() => new Map((form?.fields || []).map((f) => [f.id, f])), [form]);

  const steps = useMemo(() => {
    if (!form) return [];
    return form.fields.filter((f) => isFieldVisible(f, answers, fieldsById));
  }, [form, answers, fieldsById]);

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

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const { applicantFirstName, applicantLastName, applicantEmail, applicantPhone, ...responses } = answers;
      const res = await fetch(`${API_BASE}/api/job-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostingId,
          applicantFirstName,
          applicantLastName,
          applicantEmail,
          applicantPhone,
          responses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de l'envoi de la candidature");
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de l'envoi de la candidature");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tf-shell tf-shell--center">
        <p className="tf-loading">Chargement...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="tf-shell tf-shell--center">
        <p className="tf-fatal-error">{error}</p>
        <a href="/recrutement" className="tf-btn tf-btn--ghost">Retour aux offres</a>
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
          <h1 className="tf-done__title">Candidature envoyée !</h1>
          <p className="tf-done__subtitle">
            Merci pour votre candidature à « {form.title} ». Vous recevrez un email si votre profil est retenu.
          </p>
          <a href="/recrutement" className="tf-btn tf-btn--primary">Retour aux offres</a>
        </div>
        <JobApplicationFormStyles />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="tf-shell tf-shell--center">
        <div className="tf-cover">
          <h1 className="tf-cover__title">Postuler — {form.title}</h1>
          {form.estimatedDuration && <p className="tf-cover__meta">Durée estimée : {form.estimatedDuration}</p>}
          <button type="button" className="tf-btn tf-btn--primary tf-btn--lg" onClick={() => setStarted(true)}>
            Commencer →
          </button>
        </div>
        <JobApplicationFormStyles />
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
        <a href="/recrutement" className="tf-topbar__quit">✕ Quitter</a>
      </div>

      <div className="tf-stage">
        <div key={currentIndex} className={`tf-question tf-question--${direction}`}>
          {isReview ? (
            <div className="tf-review">
              <h1 className="tf-question__title">Tout est prêt, {answers.applicantFirstName || "vous"} !</h1>
              <p className="tf-review__desc">
                Vérifiez que votre email est correct — c'est là que nous vous répondrons :
                <strong> {answers.applicantEmail}</strong>
              </p>
              {submitError && <p className="tf-error" role="alert">{submitError}</p>}
              <div className="tf-nav tf-nav--review">
                <button type="button" className="tf-btn tf-btn--ghost" onClick={goPrev}>← Modifier mes réponses</button>
                <button type="button" className="tf-btn tf-btn--primary tf-btn--lg" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Envoi..." : "Envoyer ma candidature →"}
                </button>
              </div>
            </div>
          ) : (
            <form
              className="tf-form"
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
            >
              {parentField && (
                <p className="tf-question__hint">↳ Suite à votre réponse à « {parentField.label} »</p>
              )}
              <h1 className="tf-question__title">
                {currentStep.label} {currentStep.required && <span className="tf-question__required">*</span>}
              </h1>

              {currentStep.type === "TEXTAREA" && (
                <textarea
                  ref={inputRef}
                  className="tf-textarea"
                  rows={4}
                  placeholder="Tapez votre réponse ici..."
                  value={answers[currentStep.id] || ""}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      goNext();
                    }
                  }}
                />
              )}

              {currentStep.type === "SELECT" && (
                <div className="tf-choices">
                  {(currentStep.options || []).map((opt, i) => (
                    <button
                      type="button"
                      key={opt}
                      className={`tf-choice ${answers[currentStep.id] === opt ? "tf-choice--selected" : ""}`}
                      onClick={() => selectChoice(opt)}
                    >
                      <span className="tf-choice__badge">{String.fromCharCode(65 + i)}</span>
                      <span className="tf-choice__label">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStep.type === "CHECKBOX" && (
                <div className="tf-choices">
                  <button
                    type="button"
                    className={`tf-choice ${answers[currentStep.id] === true ? "tf-choice--selected" : ""}`}
                    onClick={() => selectChoice(true)}
                  >
                    <span className="tf-choice__badge">✓</span>
                    <span className="tf-choice__label">Oui</span>
                  </button>
                  <button
                    type="button"
                    className={`tf-choice ${answers[currentStep.id] === false ? "tf-choice--selected" : ""}`}
                    onClick={() => selectChoice(false)}
                  >
                    <span className="tf-choice__badge">✕</span>
                    <span className="tf-choice__label">Non</span>
                  </button>
                </div>
              )}

              {["TEXT", "EMAIL", "PHONE", "NUMBER", "DATE"].includes(currentStep.type) && (
                <input
                  ref={inputRef}
                  className="tf-input"
                  type={INPUT_TYPE[currentStep.type] || "text"}
                  placeholder="Tapez votre réponse ici..."
                  value={answers[currentStep.id] || ""}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}

              {stepError && <p className="tf-error" role="alert">{stepError}</p>}

              <div className="tf-nav">
                <button type="button" className="tf-btn tf-btn--ghost" onClick={goPrev} disabled={currentIndex === 0}>
                  ← Précédent
                </button>
                <span className="tf-nav__spacer" />
                {!["SELECT", "CHECKBOX"].includes(currentStep.type) && (
                  <span className="tf-nav__hint">Appuyez sur Entrée ↵</span>
                )}
                <button type="submit" className="tf-btn tf-btn--primary">Suivant →</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <JobApplicationFormStyles />
    </div>
  );
}

function JobApplicationFormStyles() {
  // Même feuille de style que VolunteerApplicationForm.jsx (plein écran
  // volontairement toujours sombre, couleurs figées en hexadécimal plutôt
  // que var(--col-*), voir son commentaire pour le raisonnement complet).
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

      .tf-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--sp-5) var(--sp-6); flex-shrink: 0;
      }
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

      .tf-error {
        color: #FFC9C9; font-size: var(--text-sm); margin-top: var(--sp-4); font-weight: 600;
        animation: tf-shake 0.4s ease;
      }
      @keyframes tf-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }

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

      .tf-cover { max-width: 34rem; display: flex; flex-direction: column; align-items: center; }
      .tf-cover__title {
        font-family: var(--font-heading); font-weight: 500; font-size: clamp(1.75rem, 5vw, 2.75rem);
        margin-bottom: var(--sp-4); line-height: 1.2; color: #FFFFFF;
      }
      .tf-cover__meta { color: rgba(255,255,255,0.7); font-size: var(--text-sm); margin-bottom: var(--sp-8); }

      .tf-review__desc { color: rgba(255,255,255,0.88); font-size: var(--text-lg); margin-bottom: var(--sp-6); }

      .tf-done { max-width: 30rem; display: flex; flex-direction: column; align-items: center; }
      .tf-check { width: 4.5rem; height: 4.5rem; margin-bottom: var(--sp-6); }
      .tf-check__circle {
        stroke: ${palette.accent}; stroke-width: 2; stroke-dasharray: 151; stroke-dashoffset: 151;
        animation: tf-draw-circle 0.6s ease forwards;
      }
      .tf-check__mark {
        stroke: #FFFFFF; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;
        stroke-dasharray: 40; stroke-dashoffset: 40; animation: tf-draw-mark 0.4s 0.6s ease forwards;
      }
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
