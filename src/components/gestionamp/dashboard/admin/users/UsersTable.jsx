import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

/**
 * Tableau de gestion des utilisateurs EC & IS
 * Accès ADMIN uniquement
 */
export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // Logo d'un compte PARTENAIRE — l'ADMIN peut le définir/corriger ici, en
  // plus du self-service déjà existant côté partenaire lui-même (voir
  // PartnerDashboard.jsx#uploadLogo). apiFetch force Content-Type: JSON,
  // donc un fetch brut est nécessaire pour ce endpoint multipart.
  const [uploadingLogoFor, setUploadingLogoFor] = useState(null);

  /**
   * Chargement des utilisateurs
   */
  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/users");
      setUsers(data);
    } catch (error) {
      console.error("Erreur chargement utilisateurs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Activer / Désactiver un utilisateur
   */
  const toggleStatus = async (userId, currentStatus) => {
    if (!confirm("Confirmer le changement de statut ?")) return;

    try {
      await apiFetch(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur changement statut", error);
    }
  };

  /**
   * ADMIN définit/corrige le logo d'un compte PARTENAIRE
   */
  const uploadPartnerLogo = async (userId, file) => {
    if (!file) return;
    setUploadingLogoFor(userId);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("amp_token");
      const res = await fetch(`${API_BASE}/gestionamp/api/users/${userId}/partner-logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Erreur lors de l'envoi du logo");
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, partnerLogoUrl: body.partnerLogoUrl } : u)));
    } catch (error) {
      alert(error.message || "Erreur lors de l'envoi du logo");
    } finally {
      setUploadingLogoFor(null);
    }
  };

  /**
   * Supprimer un utilisateur
   */
  const deleteUser = async (userId) => {
    if (!confirm("⚠️ Suppression définitive. Continuer ?")) return;

    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur suppression utilisateur", error);
    }
  };

  if (loading) return <p>Chargement des utilisateurs...</p>;

  return (
    <div className="users-table">
      <h3>Comptes existants</h3>

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Espace associé</th>
            <th>Logo</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="6">Aucun utilisateur trouvé</td>
            </tr>
          )}

          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name || user.email}</td>
              <td>{user.role}</td>

              <td>
                {user.role === "EC" && user.coordinationCommunaleId?.name}
                {user.role === "IS" && user.institutionSpecialiseeId?.name}
              </td>

              <td>
                {user.role === "PARTENAIRE" ? (
                  <div className="partner-logo-cell">
                    {user.partnerLogoUrl ? (
                      <img src={user.partnerLogoUrl} alt="Logo" className="partner-logo-cell__thumb" />
                    ) : (
                      <span className="partner-logo-cell__empty">Aucun</span>
                    )}
                    <label className="partner-logo-cell__upload">
                      {uploadingLogoFor === user._id ? "Envoi..." : "Changer"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadPartnerLogo(user._id, e.target.files?.[0])}
                        disabled={uploadingLogoFor === user._id}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                ) : (
                  "—"
                )}
              </td>

              <td>
                {user.isActive ? (
                  <span className="status active">Actif</span>
                ) : (
                  <span className="status inactive">Inactif</span>
                )}
              </td>

              <td className="actions">
                <button
                  onClick={() => toggleStatus(user._id, user.isActive)}
                >
                  {user.isActive ? "Désactiver" : "Activer"}
                </button>

                <button
                  className="danger"
                  onClick={() => deleteUser(user._id)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .partner-logo-cell { display: flex; align-items: center; gap: 8px; }
        .partner-logo-cell__thumb { height: 32px; width: 32px; border-radius: 6px; object-fit: cover; border: 1px solid var(--col-border, #DDD8CE); }
        .partner-logo-cell__empty { font-size: 0.75rem; color: var(--col-text-muted, #7A7A7A); }
        .partner-logo-cell__upload {
          font-size: 0.75rem; color: var(--col-primary, #1B4332); text-decoration: underline; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
