// src/components/admin/VolunteerProgramsManager.jsx
// Remplace CreateMission.jsx : liste + création des programmes de
// volontariat (façon NumSAL), avec accès à la gestion détaillée d'un
// programme (formulaire de candidature, candidatures) via VolunteerProgramEditor.
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import VolunteerProgramEditor from "./VolunteerProgramEditor.jsx";

const STATUS_LABELS = { DRAFT: "Brouillon", PUBLISHED: "Publié", ARCHIVED: "Archivé", CLOSED: "Fermé" };
const STATUS_COLORS = {
  DRAFT: "bg-gray-200 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-red-100 text-red-700",
  CLOSED: "bg-orange-100 text-orange-700",
};

const emptyForm = {
  title: "", coverImageUrl: "", location: "", startDate: "", endDate: "", capacity: "",
  accessMode: "APPLICATION", applicationDeadline: "", status: "DRAFT",
};

export default function VolunteerProgramsManager() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyLink = async (program) => {
    const url = `${window.location.origin}/volontaires/candidature/${program._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(program._id);
      setTimeout(() => setCopiedId((id) => (id === program._id ? null : id)), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await adminFetch("/api/volunteer-programs/all");
      setPrograms(data?.items || []);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch("/api/volunteer-programs", { method: "POST", body: JSON.stringify(form) });
      setMessage({ type: "success", text: "Programme créé avec succès !" });
      setForm(emptyForm);
      fetchPrograms();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (program, newStatus) => {
    try {
      await adminFetch(`/api/volunteer-programs/${program._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPrograms();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce programme ?")) return;
    try {
      await adminFetch(`/api/volunteer-programs/${id}`, { method: "DELETE" });
      setPrograms((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (selectedProgramId) {
    return (
      <VolunteerProgramEditor
        programId={selectedProgramId}
        onBack={() => {
          setSelectedProgramId(null);
          fetchPrograms();
        }}
      />
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <h2 className="text-2xl font-extrabold text-yellow-700 mb-4 text-center">
        🤝 Créer un programme de volontariat
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8 max-w-2xl mx-auto">
        <input
          type="text" name="title" placeholder="Titre du programme" value={form.title}
          onChange={handleChange} required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <div>
          <input
            type="url" name="coverImageUrl" placeholder="URL de l'image de couverture (aperçu affiché sur le catalogue public)"
            value={form.coverImageUrl} onChange={handleChange}
            className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
          />
          {form.coverImageUrl && (
            <img src={form.coverImageUrl} alt="Aperçu" onError={(e) => (e.target.style.display = "none")}
              onLoad={(e) => (e.target.style.display = "block")}
              className="mt-2 h-28 w-full max-w-xs object-cover rounded-lg border border-gray-200" />
          )}
        </div>
        <input
          type="text" name="location" placeholder="Lieu" value={form.location}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Date de début</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
              className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Date de fin</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
              className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number" name="capacity" placeholder="Nombre de places (optionnel)" value={form.capacity}
            onChange={handleChange} min="0"
            className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
          />
          <select name="accessMode" value={form.accessMode} onChange={handleChange}
            className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm">
            <option value="APPLICATION">Sur candidature (examinée par le staff)</option>
            <option value="OPEN">Accès ouvert (inscription directe)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Date limite pour postuler (optionnel)</label>
            <input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange}
              className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Statut</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm">
              <option value="DRAFT">Brouillon (invisible au public)</option>
              <option value="PUBLISHED">Publié (visible immédiatement)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-all shadow-lg disabled:opacity-50">
          {saving ? "En cours..." : "Créer le programme"}
        </button>
      </form>

      {message && (
        <div className={`mb-4 text-center font-semibold ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </div>
      )}

      <h3 className="mb-4 text-xl font-semibold text-gray-700 text-center">Programmes existants</h3>
      {loading ? (
        <p className="text-center text-gray-500">Chargement...</p>
      ) : programs.length === 0 ? (
        <p className="text-center text-gray-500">Aucun programme pour l'instant</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg bg-white">
            <thead className="bg-yellow-100">
              <tr>
                <th className="px-4 py-2 border">Titre</th>
                <th className="px-4 py-2 border">Lieu</th>
                <th className="px-4 py-2 border">Statut</th>
                <th className="px-4 py-2 border">Accès</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p._id} className="hover:bg-yellow-50">
                  <td className="px-4 py-2 border">{p.title}</td>
                  <td className="px-4 py-2 border">{p.location || "—"}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">{p.accessMode === "OPEN" ? "Ouvert" : "Candidature"}</td>
                  <td className="px-4 py-2 border">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button onClick={() => setSelectedProgramId(p._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
                        Gérer →
                      </button>
                      <button onClick={() => copyLink(p)}
                        className={`px-3 py-1 rounded-lg text-white ${copiedId === p._id ? "bg-green-600" : "bg-violet-600 hover:bg-violet-700"}`}>
                        {copiedId === p._id ? "✓ Copié" : "🔗 Copier le lien"}
                      </button>
                      {p.status === "PUBLISHED" ? (
                        <button onClick={() => toggleStatus(p, "DRAFT")}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg">
                          Dépublier
                        </button>
                      ) : (
                        <button onClick={() => toggleStatus(p, "PUBLISHED")}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg">
                          Publier
                        </button>
                      )}
                      <button onClick={() => handleDelete(p._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
