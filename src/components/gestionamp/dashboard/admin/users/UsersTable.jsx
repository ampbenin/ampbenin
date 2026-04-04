import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

/**
 * Tableau de gestion des utilisateurs EC & IS
 * Accès ADMIN uniquement
 */
export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Chargement des utilisateurs
   */
  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/admin/users");
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
      await apiFetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur changement statut", error);
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
      <h2>Gestion des utilisateurs (EC & IS)</h2>

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Espace associé</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="5">Aucun utilisateur trouvé</td>
            </tr>
          )}

          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name || user.email}</td>
              <td>{user.role}</td>

              <td>
                {user.role === "EC" && user.coordinationCommunale?.name}
                {user.role === "IS" && user.institutionSpecialisee?.name}
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
    </div>
  );
}
