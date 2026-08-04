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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Mot de passe réinitialisé</h2>
        <p className="text-sm text-gray-600 mb-5">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </p>
        <a href="/admin/login" className="text-violet-700 hover:underline text-sm font-medium">
          Se connecter →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Choisir un nouveau mot de passe</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}
      {!token && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          Lien de réinitialisation manquant ou invalide.
        </p>
      )}

      <input
        type="password"
        placeholder="Nouveau mot de passe (8 caractères min.)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />
      <input
        type="password"
        placeholder="Confirmer le nouveau mot de passe"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
