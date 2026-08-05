import { useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import AuthCard from "./AuthCard.jsx";

export default function RegisterForm() {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await volunteerFetch("/volunteer-auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSent(data.message);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Vérifiez votre boîte mail">
        <p className="mesp-success">{sent}</p>
        <div className="mesp-links">
          <a href="/mon-espace/login">Retour à la connexion</a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Créer mon espace volontaire"
      subtitle="Si vous avez déjà postulé avec cet email, votre profil existant sera automatiquement relié.">
      <form onSubmit={handleSubmit}>
        {error && <p className="mesp-error">{error}</p>}

        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-prenom">Prénom</label>
          <input id="mesp-prenom" type="text" className="mesp-input" value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
        </div>
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-nom">Nom</label>
          <input id="mesp-nom" type="text" className="mesp-input" value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-email">Email</label>
          <input id="mesp-email" type="email" className="mesp-input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
        </div>
        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-tel">Téléphone (optionnel)</label>
          <input id="mesp-tel" type="tel" className="mesp-input" value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        </div>

        <button type="submit" className="mesp-btn" disabled={loading}>
          {loading ? "Envoi..." : "Créer mon espace"}
        </button>

        <div className="mesp-links">
          <a href="/mon-espace/login">Déjà un compte ? Connectez-vous</a>
        </div>
      </form>
    </AuthCard>
  );
}
