import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

const ROLE_REDIRECTS = {
  ADMIN: "/admin/dashboard",
  EDITOR: "/admin/dashboard",
  EC: "/gestionamp/dashboard/ec",
  IS: "/gestionamp/dashboard/is",
};

export default function ChangePasswordForm({ forced = false }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
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

    setLoading(true);
    try {
      const data = await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });

      if (data?.token) {
        localStorage.setItem("amp_token", data.token);
      }

      const role = localStorage.getItem("amp_role");
      window.location.href = ROLE_REDIRECTS[role] || "/admin/login";
    } catch (err) {
      setError(err.message || "Impossible de changer le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {forced ? "Changement de mot de passe requis" : "Changer mon mot de passe"}
      </h2>
      {forced && (
        <p className="text-sm text-gray-500 mb-5">
          Pour des raisons de sécurité, vous devez choisir un nouveau mot de passe avant de continuer.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <input
        type="password"
        placeholder="Nouveau mot de passe (8 caractères min.)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        className={`w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${forced ? "mt-5" : ""} mb-4`}
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
        disabled={loading}
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Valider le nouveau mot de passe"}
      </button>
    </form>
  );
}
