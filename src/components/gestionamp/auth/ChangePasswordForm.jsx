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
    <form onSubmit={handleSubmit} style={{ width: 340 }}>
      <h2>{forced ? "Changement de mot de passe requis" : "Changer mon mot de passe"}</h2>
      {forced && (
        <p style={{ fontSize: "0.85rem", color: "#555" }}>
          Pour des raisons de sécurité, vous devez choisir un nouveau mot de passe avant de continuer.
        </p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

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

      <button type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Enregistrement..." : "Valider le nouveau mot de passe"}
      </button>
    </form>
  );
}
