import { useState, useEffect } from "react";
import { apiFetch } from "@/services/gestionamp/api";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError("Lien de réinitialisation invalide.");
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
      await apiFetch("/auth/reset-password", {
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
      <div style={{ width: 340 }}>
        <h2>Mot de passe réinitialisé</h2>
        <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <a href="/admin/login">Se connecter</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: 340 }}>
      <h2>Choisir un nouveau mot de passe</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!token && <p style={{ color: "red" }}>Lien de réinitialisation manquant ou invalide.</p>}

      <input
        type="password"
        placeholder="Nouveau mot de passe (8 caractères min.)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Confirmer le nouveau mot de passe"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button type="submit" disabled={loading || !token} style={{ width: "100%" }}>
        {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
