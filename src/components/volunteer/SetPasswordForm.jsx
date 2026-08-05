import { useState, useEffect } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import AuthCard from "./AuthCard.jsx";

// Sert à la fois l'activation initiale d'un compte (lien reçu à
// l'inscription ou à l'acceptation d'une candidature) et la
// réinitialisation "mot de passe oublié" — même formulaire, le serveur ne
// distingue pas les deux cas (voir controllers/volunteerAuthController.js).
export default function SetPasswordForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError("Lien invalide ou incomplet.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await volunteerFetch("/volunteer-auth/set-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="Mot de passe défini !">
        <p className="mesp-success">Vous pouvez maintenant vous connecter à votre espace volontaire.</p>
        <div className="mesp-links">
          <a href="/mon-espace/login">Se connecter →</a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Définir votre mot de passe">
      <form onSubmit={handleSubmit}>
        {error && <p className="mesp-error">{error}</p>}
        {!token && (
          <p className="mesp-error">Lien manquant ou invalide — utilisez le lien reçu par email.</p>
        )}

        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-new">Nouveau mot de passe (8 caractères min.)</label>
          <input id="mesp-new" type="password" className="mesp-input" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </div>
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-confirm">Confirmer le mot de passe</label>
          <input id="mesp-confirm" type="password" className="mesp-input" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
        </div>

        <button type="submit" className="mesp-btn" disabled={loading || !token}>
          {loading ? "Enregistrement..." : "Définir mon mot de passe"}
        </button>
      </form>
    </AuthCard>
  );
}
