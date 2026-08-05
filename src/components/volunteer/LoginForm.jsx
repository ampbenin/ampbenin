import { useState } from "react";
import { volunteerFetch } from "@/services/volunteer/api";
import AuthCard from "./AuthCard.jsx";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await volunteerFetch("/volunteer-auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("volunteer_token", data.token);
      window.location.href = "/mon-espace";
    } catch (err) {
      setError(err.message || "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Connexion" subtitle="Accédez à vos candidatures, vos missions et vos attestations.">
      <form onSubmit={handleSubmit}>
        {error && <p className="mesp-error">{error}</p>}

        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-email">Email</label>
          <input id="mesp-email" type="email" className="mesp-input" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>

        <div className="mesp-field">
          <label className="mesp-label" htmlFor="mesp-password">Mot de passe</label>
          <input id="mesp-password" type="password" className="mesp-input" value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        <button type="submit" className="mesp-btn" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="mesp-links">
          <a href="/mon-espace/mot-de-passe-oublie">Mot de passe oublié ?</a>
          <a href="/mon-espace/inscription">Pas encore de compte ? Inscrivez-vous</a>
        </div>
      </form>
    </AuthCard>
  );
}
