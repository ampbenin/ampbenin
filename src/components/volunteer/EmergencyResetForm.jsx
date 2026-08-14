// src/components/volunteer/EmergencyResetForm.jsx
// Page publique du lien de réinitialisation d'urgence (mesure temporaire
// activée par un ADMIN, voir EmergencyResetManager.jsx +
// controllers/emergencyResetController.js). Pas de token secret par
// volontaire : le lien est partagé, la sécurité vient de la question de
// contrôle (nom/prénom/téléphone/âge, choisie par l'ADMIN) comparée à la
// fiche du volontaire qui s'identifie par email.
import { useEffect, useState } from "react";
import AuthCard from "./AuthCard.jsx";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

const FIELD_INPUT_TYPE = { nom: "text", prenom: "text", telephone: "tel", age: "number" };

export default function EmergencyResetForm({ token }) {
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [validationField, setValidationField] = useState("");

  const [step, setStep] = useState("identify"); // "identify" | "password" | "done"
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/emergency-reset/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setLinkError(data.message || "Ce lien est invalide ou a expiré.");
        } else {
          setFieldLabel(data.fieldLabel);
          setValidationField(data.validationField);
        }
      } catch {
        setLinkError("Impossible de vérifier ce lien pour le moment. Réessayez plus tard.");
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const submitIdentity = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !answer.trim()) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/emergency-reset/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), answer: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Identification impossible");
      setStep("password");
    } catch (err) {
      setError(err.message || "Identification impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/emergency-reset/${token}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), answer: answer.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la réinitialisation");
      setStep("done");
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <AuthCard title="Vérification du lien...">
        <p className="mesp-subtitle">Un instant, merci de patienter.</p>
      </AuthCard>
    );
  }

  if (linkError) {
    return (
      <AuthCard title="Lien indisponible">
        <p className="mesp-error">{linkError}</p>
        <div className="mesp-links">
          <a href="/mon-espace/mot-de-passe-oublie">Demander un lien classique →</a>
          <a href="/mon-espace/login">Retour à la connexion →</a>
        </div>
      </AuthCard>
    );
  }

  if (step === "done") {
    return (
      <AuthCard title="Mot de passe réinitialisé !">
        <p className="mesp-success">Vous pouvez maintenant vous connecter à votre espace volontaire avec votre nouveau mot de passe.</p>
        <div className="mesp-links">
          <a href="/mon-espace/login">Se connecter →</a>
        </div>
      </AuthCard>
    );
  }

  if (step === "password") {
    return (
      <AuthCard title="Nouveau mot de passe" subtitle="Identité confirmée — définissez votre nouveau mot de passe.">
        <form onSubmit={submitPassword}>
          {error && <p className="mesp-error">{error}</p>}
          <div className="mesp-field">
            <label className="mesp-label" htmlFor="er-new">Nouveau mot de passe (8 caractères min.)</label>
            <input id="er-new" type="password" className="mesp-input" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="mesp-field">
            <label className="mesp-label" htmlFor="er-confirm">Confirmer le mot de passe</label>
            <input id="er-confirm" type="password" className="mesp-input" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="mesp-btn" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Définir mon mot de passe"}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Réinitialisation d'urgence"
      subtitle="Confirmez votre identité pour réinitialiser votre mot de passe."
    >
      <form onSubmit={submitIdentity}>
        {error && <p className="mesp-error">{error}</p>}
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="er-email">Votre email</label>
          <input id="er-email" type="email" className="mesp-input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="er-answer">{fieldLabel ? fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1) : "Réponse"}</label>
          <input id="er-answer" type={FIELD_INPUT_TYPE[validationField] || "text"} className="mesp-input" value={answer}
            onChange={(e) => setAnswer(e.target.value)} required />
        </div>
        <button type="submit" className="mesp-btn" disabled={submitting}>
          {submitting ? "Vérification..." : "Vérifier mon identité"}
        </button>
      </form>
    </AuthCard>
  );
}
