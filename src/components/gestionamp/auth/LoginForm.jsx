import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

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
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!data?.token || !data?.user?.role) {
        setError("Identifiants invalides");
        return;
      }

      // ✅ Stockage du token
      localStorage.setItem("amp_token", data.token);

      // ✅ Redirection selon rôle
      switch (data.user.role) {
        case "ADMIN":
          window.location.href = "/gestionamp/dashboard/admin";
          break;
        case "EC":
          window.location.href = "/gestionamp/dashboard/ec";
          break;
        case "IS":
          window.location.href = "/gestionamp/dashboard/is";
          break;
        default:
          setError("Rôle utilisateur non reconnu");
      }
    } catch (err) {
      setError("Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "320px" }}>
      <h2>Connexion AMP</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="email"
        placeholder="Email professionnel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
