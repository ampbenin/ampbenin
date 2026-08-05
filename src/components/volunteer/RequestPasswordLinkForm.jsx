import { useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import AuthCard from "./AuthCard.jsx";

export default function RequestPasswordLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await volunteerFetch("/volunteer-auth/request-password-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Vérifiez votre boîte mail">
        <p className="mesp-success">
          Si un compte existe avec cet email, un lien pour définir votre mot de passe vient de vous être envoyé
          (valable 1 heure).
        </p>
        <div className="mesp-links">
          <a href="/mon-espace/login">Retour à la connexion</a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Mot de passe oublié"
      subtitle="Indiquez votre email, nous vous enverrons un lien pour choisir un nouveau mot de passe.">
      <form onSubmit={handleSubmit}>
        {error && <p className="mesp-error">{error}</p>}

        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-email">Email</label>
          <input id="mesp-email" type="email" className="mesp-input" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>

        <button type="submit" className="mesp-btn" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>

        <div className="mesp-links">
          <a href="/mon-espace/login">Retour à la connexion</a>
        </div>
      </form>
    </AuthCard>
  );
}
