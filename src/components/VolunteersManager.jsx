import { useState, useEffect, useRef } from "react";
import { FiMoreVertical, FiChevronDown } from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE =
  (import.meta?.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/volunteers`
    : "https://potential-rafa-amp1-00541efa.koyeb.app/api/volunteers");

export default function VolunteersManager() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMission, setFilterMission] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [detailsVolunteer, setDetailsVolunteer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const volunteersPerPage = 10;

  // Charger tous les volontaires
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await fetch(API_BASE);
        const data = await res.json();
setVolunteers(
  (
    Array.isArray(data)
      ? data
      : Array.isArray(data.items)
      ? data.items
      : []
  ).map((v) => ({
    ...v,
    missions: (v.missions || []).filter(
      (m) => m?.missionId && typeof m.missionId === "object"
    ),
  }))
);
      } catch (err) {
        console.error("Erreur chargement volontaires :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  // Fermer le menu en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrage
  const filteredVolunteers = volunteers.filter((v) => {
    const matchSearch =
      v.nom?.toLowerCase().includes(search.toLowerCase()) ||
      v.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase());

    if (!filterMission) return matchSearch;

    const mission = v.missions?.find(
      (m) =>
        (m.missionId?.titre || m.missionId)
          .toLowerCase() === filterMission.toLowerCase()
    );

    if (!mission) return false;

    if (filterStatut && mission.statut !== filterStatut) return false;

    return matchSearch;
  });

  // Pagination
  const indexOfLast = currentPage * volunteersPerPage;
  const indexOfFirst = indexOfLast - volunteersPerPage;
  const currentVolunteers = filteredVolunteers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVolunteers.length / volunteersPerPage);

  // Suppression
  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce volontaire ?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setVolunteers((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur suppression");
    }
  };

  // Mise à jour
  const handleUpdate = async (vol) => {
    try {
      const payload = {
        email: vol.email,
        nom: vol.nom,
        prenom: vol.prenom,
        telephone: vol.telephone,
        missions: vol.missions?.map((m) => ({
          missionId: m.missionId?._id || m.missionId,
          statut: m.statut || "Non disponible",
        })) || [],
      };

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur mise à jour");

      const data = await res.json();

      setVolunteers((prev) =>
        prev.map((v) => (v.email === data.volunteer.email ? data.volunteer : v))
      );

      setEditingVolunteer(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des volontaires", 14, 16);
    autoTable(doc, {
      head: [["Nom", "Prénom", "Email", "Téléphone", "Missions"]],
      body: filteredVolunteers.map((v) => [
        v.nom,
        v.prenom,
        v.email,
        v.telephone || "-",
        v.missions
          ?.map((m) => `${m.missionId?.titre || m.missionId} (${m.statut})`)
          .join(", ") || "-",
      ]),
      startY: 20,
    });
    doc.save("volontaires.pdf");
  };

  // Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredVolunteers.map((v) => ({
        Nom: v.nom,
        Prénom: v.prenom,
        Email: v.email,
        Téléphone: v.telephone || "-",
        Missions:
          v.missions
            ?.map((m) => `${m.missionId?.titre || m.missionId} (${m.statut})`)
            .join(", ") || "-",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Volontaires");
    XLSX.writeFile(workbook, "volontaires.xlsx");
  };

  if (loading) return <p className="text-center">Chargement...</p>;

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-violet-700">
        🌍 GESTION DES VOLONTAIRES - AMP BENIN
      </h1>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-start">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded flex-1 focus:ring-2 focus:ring-violet-400"
        />

        <select
          value={filterMission}
          onChange={(e) => setFilterMission(e.target.value)}
          className="border px-3 py-2 rounded focus:ring-2 focus:ring-green-400"
        >
          <option value="">🎯 Toutes les missions</option>
          {[...new Set(
            volunteers.flatMap((v) =>
              v.missions?.map((m) => m.missionId?.titre || m.missionId).filter(Boolean)
            )
          )].map((mission) => (
            <option key={mission} value={mission}>
              {mission}
            </option>
          ))}
        </select>

        <select
          disabled={!filterMission}
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
        >
          <option value="">📌 Tous statuts</option>
          <option>Non disponible</option>
          <option>Refusé</option>
          <option>Mission validée</option>
        </select>

        {/* Export Menu */}
        <div className="relative inline-block text-left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExportMenuOpen((prev) => !prev);
            }}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded flex items-center gap-2"
          >
            📤 Export
            <FiChevronDown
              className={`w-4 h-4 ml-1 transition-transform ${
                exportMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {exportMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  exportExcel();
                  setExportMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-green-100"
              >
                📊 Export Excel
              </button>
              <button
                onClick={() => {
                  exportPDF();
                  setExportMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-100"
              >
                📑 Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-auto border rounded-lg shadow-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gradient-to-r from-green-300 via-blue-300 to-violet-300 sticky top-0 z-10">
            <tr className="text-left text-white">
              <th className="py-3 px-4">Nom complet</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Téléphone</th>
              <th className="py-3 px-4">Missions</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVolunteers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Aucun volontaire trouvé.
                </td>
              </tr>
            )}
            {currentVolunteers.map((v) => (
              <tr
                key={v._id || Math.random()}
                className="odd:bg-violet-50 even:bg-blue-50 border-t hover:bg-green-100 transition"
              >
                <td className="px-4 py-2">{v.fullName || `${v.nom} ${v.prenom}`}</td>
                <td className="px-4 py-2">{v.email}</td>
                <td className="px-4 py-2">{v.telephone || "-"}</td>
                <td className="px-4 py-2">
                  {v.missions && v.missions.length > 0 ? (
                    <>
                      <span className="text-xs text-gray-500 mb-1 block">
                        {v.missions.length} mission(s)
                      </span>
                      <ol className="space-y-1 text-sm">
                        {(v.showAllMissions ? v.missions : v.missions.slice(0, 2)).map(
                          (m, index) => (
                            <li key={m.missionId?._id || index} className="flex items-center gap-2">
                              <span className="font-bold text-violet-600 w-5">
                                {index + 1}.
                              </span>
                              <span className="font-medium truncate max-w-[140px]">
                                {m.missionId?.titre || m.missionId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  m.statut === "Mission validée"
                                    ? "bg-green-100 text-green-700"
                                    : m.statut === "Refusé"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {m.statut || "Non disponible"}
                              </span>
                            </li>
                          )
                        )}
                      </ol>
                      {v.missions.length > 2 && (
                        <button
                          onClick={() =>
                            setVolunteers((prev) =>
                              prev.map((vol) =>
                                vol._id === v._id
                                  ? { ...vol, showAllMissions: !vol.showAllMissions }
                                  : vol
                              )
                            )
                          }
                          className="mt-1 text-xs text-blue-600 hover:underline"
                        >
                          {v.showAllMissions ? "Masquer" : "Afficher plus"}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">—</span>
                  )}
                </td>

                <td className="px-4 py-2 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuOpen({ id: v._id, x: rect.right, y: rect.bottom });
                    }}
                    className="p-2 rounded hover:bg-violet-200"
                  >
                    <FiMoreVertical />
                  </button>

                  {menuOpen?.id === v._id && (
                    <div
                      ref={menuRef}
                      className="fixed w-50 bg-yellow-200 border rounded-lg shadow-xl z-50"
                      style={{
                        top: menuOpen.y - 120 + "px",
                        left: menuOpen.x - 130 + "px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setDetailsVolunteer(v);
                          setMenuOpen(null);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-green-100"
                      >
                        👀 Voir détails
                      </button>
                      <button
                        onClick={() => {
                          setEditingVolunteer(v);
                          setMenuOpen(null);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(v._id);
                          setMenuOpen(null);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-red-100"
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          ◀ Précédent
        </button>
        <span className="px-4 py-1">
          Page {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          Suivant ▶
        </button>
      </div>

      {/* Modals Détails et Modification */}
      {detailsVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl mb-4 font-bold text-violet-700">
              Détails du volontaire
            </h2>
            <p>
              <b>Nom :</b> {detailsVolunteer.nom}
            </p>
            <p>
              <b>Prénom :</b> {detailsVolunteer.prenom}
            </p>
            <p>
              <b>Email :</b> {detailsVolunteer.email}
            </p>
            <p>
              <b>Téléphone :</b> {detailsVolunteer.telephone}
            </p>
            <div>
              <b>Missions :</b>
              <ul>
                {detailsVolunteer.missions?.map((m) => (
                  <li key={m.missionId?._id || m.missionId}>
                    {m.missionId?.titre || m.missionId} ({m.statut || "Non disponible"})
                  </li>
                )) || "-"}
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDetailsVolunteer(null)}
                className="px-4 py-2 rounded bg-violet-500 text-white hover:bg-violet-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl mb-4 font-bold text-blue-600">
              Modifier volontaire
            </h2>

            <input
              type="text"
              value={editingVolunteer.nom}
              onChange={(e) =>
                setEditingVolunteer({ ...editingVolunteer, nom: e.target.value })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />

            <input
              type="text"
              value={editingVolunteer.prenom}
              onChange={(e) =>
                setEditingVolunteer({
                  ...editingVolunteer,
                  prenom: e.target.value,
                })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />

            <input
              type="email"
              value={editingVolunteer.email}
              onChange={(e) =>
                setEditingVolunteer({
                  ...editingVolunteer,
                  email: e.target.value,
                })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />

            <input
              type="text"
              value={editingVolunteer.telephone || ""}
              onChange={(e) =>
                setEditingVolunteer({
                  ...editingVolunteer,
                  telephone: e.target.value,
                })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />

            {/* Missions */}
            <div className="mt-2">
              <p className="font-bold mb-1">Missions :</p>
              {editingVolunteer.missions?.map((m, index) => (
                <div key={m.missionId?._id || index} className="mb-2 flex gap-2 items-center">
                  <span className="flex-1">{m.missionId?.titre || m.missionId}</span>
                  <select
                    value={m.statut || "Non disponible"}
                    onChange={(e) => {
                      const missions = [...editingVolunteer.missions];
                      missions[index] = { ...missions[index], statut: e.target.value };
                      setEditingVolunteer({ ...editingVolunteer, missions });
                    }}
                    className="border px-2 py-1 rounded"
                  >
                    <option value="Non disponible">Non disponible</option>
                    <option value="Refusé">Refusé</option>
                    <option value="Mission validée">Mission validée</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdate(editingVolunteer)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
