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

      // ✅ Stockage du token et du rôle (utilisé pour l'affichage de la navigation admin)
      localStorage.setItem("amp_token", data.token);
      localStorage.setItem("amp_role", data.user.role);

      // 🔐 Mot de passe temporaire : on force le changement avant tout accès
      if (data.user.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }

      // ✅ Redirection selon rôle
      switch (data.user.role) {
        case "ADMIN":
        case "EDITOR":
          window.location.href = "/admin/dashboard";
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
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <span className="block text-xs font-semibold uppercase tracking-wide text-violet-600 mb-1">
        AMP BÉNIN
      </span>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Connexion admin</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <input
        type="email"
        placeholder="Email professionnel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      <p className="mt-4 text-center text-sm">
        <a href="/forgot-password" className="text-violet-700 hover:underline">
          Mot de passe oublié ?
        </a>
      </p>
    </form>
  );
}
