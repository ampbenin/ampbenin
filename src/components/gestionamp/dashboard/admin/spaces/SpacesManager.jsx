import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

/**
 * Gestion générique d'un type d'"espace" gestionamp (Coordination Communale
 * ou Institution Spécialisée) : mêmes opérations, seul le nom du champ
 * métier (commune / domaine) change selon les props.
 */
export default function SpacesManager({ endpoint, title, extraField, extraLabel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const data = await apiFetch(`/${endpoint}`);
      setItems(data);
    } catch (err) {
      console.error(`Erreur chargement ${title}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const resetForm = () => {
    setName("");
    setExtraValue("");
    setDescription("");
    setEditingId(null);
    setError("");
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setName(item.name);
    setExtraValue(item[extraField] || "");
    setDescription(item.description || "");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = { name, [extraField]: extraValue, description };

      if (editingId) {
        await apiFetch(`/${endpoint}/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/${endpoint}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      fetchItems();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet espace ?")) return;

    try {
      await apiFetch(`/${endpoint}/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="spaces-manager">
      <h3>{title}</h3>

      <form onSubmit={handleSubmit} className="spaces-manager__form">
        <label>
          Nom
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          {extraLabel}
          <input
            type="text"
            value={extraValue}
            onChange={(e) => setExtraValue(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {error && <p className="spaces-manager__error">{error}</p>}

        <div className="spaces-manager__actions">
          <button type="submit" disabled={submitting}>
            {editingId ? "Enregistrer" : "Créer"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>{extraLabel}</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="4">Aucun élément trouvé</td>
            </tr>
          )}

          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item[extraField]}</td>
              <td>{item.description}</td>
              <td className="actions">
                <button onClick={() => startEdit(item)}>Modifier</button>
                <button className="danger" onClick={() => handleDelete(item._id)}>
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
