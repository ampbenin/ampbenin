import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  EDITOR: "Éditeur de contenu",
  EC: "Émissaire Communautaire",
  IS: "Institution Spécialisée",
  SUPERVISEUR: "Superviseur",
  PARTENAIRE: "Partenaire",
};
const EDITABLE_ROLES = ["EDITOR", "EC", "IS", "SUPERVISEUR", "PARTENAIRE"];

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

  // Édition d'un compte — bouton "Modifier" ajouté suite au signalement
  // "pas de possibilité de modifier les informations du compte" (aucune UI
  // n'existait jusqu'ici, voir aussi le correctif du bouton Supprimer).
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [coordinations, setCoordinations] = useState([]);
  const [institutions, setInstitutions] = useState([]);

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
    apiFetch("/coordinations").then(setCoordinations).catch((err) => console.error("Erreur chargement coordinations", err));
    apiFetch("/institutions").then(setInstitutions).catch((err) => console.error("Erreur chargement institutions", err));
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
   * Ouvrir/fermer le formulaire d'édition inline d'un compte
   */
  const startEdit = (user) => {
    setEditingUserId(user._id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      coordinationCommunaleId: user.coordinationCommunaleId?._id || "",
      institutionSpecialiseeId: user.institutionSpecialiseeId?._id || "",
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm(null);
  };

  const saveEdit = async (userId) => {
    if (editForm.role === "EC" && !editForm.coordinationCommunaleId) {
      alert("Veuillez sélectionner une Coordination Communale");
      return;
    }
    if (editForm.role === "IS" && !editForm.institutionSpecialiseeId) {
      alert("Veuillez sélectionner une Institution Spécialisée");
      return;
    }

    setSavingEdit(true);
    try {
      await apiFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          coordinationCommunaleId: editForm.role === "EC" ? editForm.coordinationCommunaleId : undefined,
          institutionSpecialiseeId: editForm.role === "IS" ? editForm.institutionSpecialiseeId : undefined,
          password: editForm.password || undefined,
        }),
      });
      setEditingUserId(null);
      setEditForm(null);
      fetchUsers();
    } catch (error) {
      alert(error.message || "Erreur lors de la mise à jour du compte");
    } finally {
      setSavingEdit(false);
    }
  };

  /**
   * Supprimer un utilisateur
   */
  const deleteUser = async (userId) => {
    if (!confirm("⚠️ Suppression définitive. Continuer ?")) return;

    try {
      await apiFetch(`/users/${userId}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch (error) {
      alert(error.message || "Erreur lors de la suppression du compte");
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

          {users.map((user) => {
            const isEditing = editingUserId === user._id;

            if (isEditing) {
              return (
                <tr key={user._id}>
                  <td>
                    <input type="text" value={editForm.name} placeholder="Nom"
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <br />
                    <input type="email" value={editForm.email} placeholder="Email"
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    <br />
                    <input type="password" value={editForm.password} placeholder="Nouveau mot de passe (optionnel)"
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                  </td>
                  <td>
                    {user.role === "ADMIN" ? (
                      <span title="Le rôle d'un compte ADMIN ne peut pas être changé depuis ce formulaire">{ROLE_LABELS.ADMIN}</span>
                    ) : (
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        {EDITABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {editForm.role === "EC" && (
                      <select value={editForm.coordinationCommunaleId}
                        onChange={(e) => setEditForm({ ...editForm, coordinationCommunaleId: e.target.value })}>
                        <option value="">-- Sélectionner --</option>
                        {coordinations.map((cc) => <option key={cc._id} value={cc._id}>{cc.name}</option>)}
                      </select>
                    )}
                    {editForm.role === "IS" && (
                      <select value={editForm.institutionSpecialiseeId}
                        onChange={(e) => setEditForm({ ...editForm, institutionSpecialiseeId: e.target.value })}>
                        <option value="">-- Sélectionner --</option>
                        {institutions.map((inst) => <option key={inst._id} value={inst._id}>{inst.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td>—</td>
                  <td>{user.isActive ? "Actif" : "Inactif"}</td>
                  <td className="actions">
                    <button onClick={() => saveEdit(user._id)} disabled={savingEdit}>
                      {savingEdit ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button onClick={cancelEdit} disabled={savingEdit}>Annuler</button>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={user._id}>
                <td>{user.name || user.email}</td>
                <td>{ROLE_LABELS[user.role] || user.role}</td>

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
                  <button onClick={() => startEdit(user)}>
                    Modifier
                  </button>

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
            );
          })}
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
