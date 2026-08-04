import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
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
      <div style={{ width: 340 }}>
        <h2>Vérifiez votre boîte mail</h2>
        <p>Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé (valable 1 heure).</p>
        <a href="/admin/login">Retour à la connexion</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: 340 }}>
      <h2>Mot de passe oublié</h2>
      <p style={{ fontSize: "0.85rem", color: "#555" }}>
        Indiquez votre email professionnel, nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="email"
        placeholder="Email professionnel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
      </button>

      <p style={{ marginTop: 12 }}>
        <a href="/admin/login">Retour à la connexion</a>
      </p>
    </form>
  );
}
