import React, { useState, useEffect } from "react";
import { adminFetch } from "@/services/admin/api";

export default function CreateMission() {
  const [form, setForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    dateDebut: "",
    dateFin: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  // Charger toutes les missions
  const fetchMissions = async () => {
    try {
      setLoadingMissions(true);
      const data = await adminFetch("/api/missions");
      // 🔹 filtrer les missions nulles et undefined
      setMissions(Array.isArray(data) ? data.filter((m) => m) : []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erreur lors du chargement des missions." });
    } finally {
      setLoadingMissions(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingMission) {
        await adminFetch(`/api/missions/${editingMission._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch("/api/missions", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }

      setMessage({
        type: "success",
        text: editingMission ? "Mission modifiée avec succès !" : "Mission créée avec succès !",
      });
      setForm({ titre: "", description: "", lieu: "", dateDebut: "", dateFin: "" });
      setEditingMission(null);
      fetchMissions();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette mission ?")) return;
    try {
      setLoading(true);
      const data = await adminFetch(`/api/missions/${id}`, { method: "DELETE" });
      setMessage({ type: "success", text: data.message });
      setMissions((prev) => prev.filter((m) => m?._id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setForm({
      titre: mission?.titre || "",
      description: mission?.description || "",
      lieu: mission?.lieu || "",
      dateDebut: mission?.dateDebut ? mission.dateDebut.slice(0, 10) : "",
      dateFin: mission?.dateFin ? mission.dateFin.slice(0, 10) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <h2 className="text-2xl font-extrabold text-yellow-700 mb-4 text-center">
        🌿 {editingMission ? "Modifier la mission" : "Créer une nouvelle mission"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          name="titre"
          placeholder="Titre de la mission"
          value={form.titre}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="text"
          name="lieu"
          placeholder="Lieu"
          value={form.lieu}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="date"
          name="dateDebut"
          value={form.dateDebut}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="date"
          name="dateFin"
          value={form.dateFin}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? "En cours..." : editingMission ? "Modifier la mission" : "Créer la mission"}
        </button>
      </form>

      <h3 className="mb-4 text-xl font-semibold text-gray-700 text-center">Missions existantes</h3>
      {loadingMissions ? (
        <p className="text-center text-gray-500">Chargement...</p>
      ) : missions.length === 0 ? (
        <p className="text-center text-gray-500">Aucune mission disponible</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg">
            <thead className="bg-yellow-100">
              <tr>
                <th className="px-4 py-2 border">Titre</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Lieu</th>
                <th className="px-4 py-2 border">Début</th>
                <th className="px-4 py-2 border">Fin</th>
                <th className="px-4 py-2 border">Statut</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m?._id || Math.random()} className="hover:bg-yellow-50">
                  <td className="px-4 py-2 border">{m?.titre || "N/A"}</td>
                  <td className="px-4 py-2 border">{m?.description || "N/A"}</td>
                  <td className="px-4 py-2 border">{m?.lieu || "N/A"}</td>
                  <td className="px-4 py-2 border">{m?.dateDebut ? m.dateDebut.slice(0, 10) : ""}</td>
                  <td className="px-4 py-2 border">{m?.dateFin ? m.dateFin.slice(0, 10) : ""}</td>
                  <td className="px-4 py-2 border">Non défini</td>
                  <td className="px-4 py-2 border flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(m)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(m?._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 text-center font-semibold ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
