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
  const [assigningMission, setAssigningMission] = useState(null);
  const [missionTitle, setMissionTitle] = useState("");
  const [detailsVolunteer, setDetailsVolunteer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const volunteersPerPage = 10;

  // Charger tous les volontaires
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await fetch(API_BASE);
        const data = await res.json();
        setVolunteers(Array.isArray(data) ? data : data.items || []);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Réinitialiser la page à 1 quand on change la recherche ou les filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMission, filterStatut]);

  // Filtrage côté client
  const filteredVolunteers = volunteers.filter((v) => {
    const matchSearch =
      v.nom?.toLowerCase().includes(search.toLowerCase()) ||
      v.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase());

    const matchMission = filterMission
      ? v.mission?.titre.toLowerCase() === filterMission.toLowerCase()
      : true;

    const matchStatut = filterStatut ? v.statut === filterStatut : true;

    return matchSearch && matchMission && matchStatut;
  });

  // Pagination - calcul index
  const indexOfLast = currentPage * volunteersPerPage;
  const indexOfFirst = indexOfLast - volunteersPerPage;
  const currentVolunteers = filteredVolunteers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVolunteers.length / volunteersPerPage);

  // suppression
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

  // mise à jour
  const handleUpdate = async (vol) => {
    try {
      const res = await fetch(`${API_BASE}/${vol._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vol),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      const updated = await res.json();
      setVolunteers((prev) =>
        prev.map((v) => (v._id === updated.volunteer._id ? updated.volunteer : v))
      );
      setEditingVolunteer(null);
    } catch (err) {
      console.error(err);
      alert("Erreur mise à jour");
    }
  };

  // attribuer mission
  const handleAssignConfirm = async () => {
    if (!assigningMission || !missionTitle.trim()) return;

    if (
      assigningMission.mission?.titre.toLowerCase() ===
      missionTitle.trim().toLowerCase()
    ) {
      alert("⚠️ Ce volontaire a déjà cette mission !");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/${assigningMission._id}/assign-mission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionTitre: missionTitle.trim() }),
        }
      );
      if (!res.ok) throw new Error("Erreur attribution mission");
      const updated = await res.json();
      setVolunteers((prev) =>
        prev.map((v) => (v._id === updated.volunteer._id ? updated.volunteer : v))
      );
      setAssigningMission(null);
      setMissionTitle("");
    } catch (err) {
      console.error(err);
      alert("Erreur attribution mission");
    }
  };

  // Export Excel
  const exportExcel = () => {
    const data = filteredVolunteers.map((v) => ({
      Nom: v.nom,
      Prénom: v.prenom,
      Email: v.email,
      Téléphone: v.telephone,
      Mission: v.mission?.titre || "-",
      Statut: v.statut,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Volontaires");
    XLSX.writeFile(workbook, "volontaires.xlsx");
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des volontaires", 14, 16);

    autoTable(doc, {
      head: [["Nom", "Prénom", "Email", "Téléphone", "Mission", "Statut"]],
      body: filteredVolunteers.map((v) => [
        v.nom,
        v.prenom,
        v.email,
        v.telephone,
        v.mission?.titre || "-",
        v.statut,
      ]),
      startY: 20,
    });

    doc.save("volontaires.pdf");
  };

  if (loading) return <p className="text-center">Chargement...</p>;

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-violet-700">
        🌍 Gestion des Volontaires
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
          {[...new Set(volunteers.map((v) => v.mission?.titre).filter(Boolean))].map(
            (mission) => (
              <option key={mission} value={mission}>
                {mission}
              </option>
            )
          )}
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
        >
          <option value="">📌 Tous statuts</option>
          <option value="Non disponible">Non disponible</option>
          <option value="Refusé">Refusé</option>
          <option value="Mission validée">Mission validée</option>
        </select>

        {/* Menu déroulant Export */}
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
              className={`w-4 h-4 ml-1 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`}
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
              <th className="py-3 px-4">Mission</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVolunteers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Aucun volontaire trouvé.
                </td>
              </tr>
            )}
            {currentVolunteers.map((v) => (
              <tr
                key={v._id}
                className="odd:bg-violet-50 even:bg-blue-50 border-t hover:bg-green-100 transition"
              >
                <td className="px-4 py-2">{v.fullName || `${v.nom} ${v.prenom}`}</td>
                <td className="px-4 py-2">{v.email}</td>
                <td className="px-4 py-2">{v.telephone || "-"}</td>
                <td className="px-4 py-2">{v.mission?.titre || "-"}</td>
                <td className="px-4 py-2">{v.statut}</td>
                <td className="px-4 py-2 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuOpen({
                        id: v._id,
                        x: rect.right,
                        y: rect.bottom,
                      });
                    }}
                    className="p-2 rounded hover:bg-violet-200"
                  >
                    <FiMoreVertical />
                  </button>

                  {menuOpen?.id === v._id && (
                    <div
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
                          setAssigningMission(v);
                          setMenuOpen(null);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-violet-100"
                      >
                        🎯 Attribuer mission
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
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

      {/* Modal Détails */}
      {detailsVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl mb-4 font-bold text-violet-700">Détails du volontaire</h2>
            <p><b>Nom :</b> {detailsVolunteer.nom}</p>
            <p><b>Prénom :</b> {detailsVolunteer.prenom}</p>
            <p><b>Email :</b> {detailsVolunteer.email}</p>
            <p><b>Téléphone :</b> {detailsVolunteer.telephone}</p>
            <p><b>Statut :</b> {detailsVolunteer.statut}</p>
            <p><b>Mission :</b> {detailsVolunteer.mission?.titre || "-"}</p>
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

      {/* Modal Modification */}
      {editingVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl mb-4 font-bold text-blue-600">Modifier volontaire</h2>
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
                setEditingVolunteer({ ...editingVolunteer, prenom: e.target.value })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />
            <input
              type="email"
              value={editingVolunteer.email}
              onChange={(e) =>
                setEditingVolunteer({ ...editingVolunteer, email: e.target.value })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />
            <input
              type="text"
              value={editingVolunteer.telephone}
              onChange={(e) =>
                setEditingVolunteer({ ...editingVolunteer, telephone: e.target.value })
              }
              className="border px-3 py-2 mb-2 w-full rounded"
            />
            <select
              value={editingVolunteer.statut}
              onChange={(e) =>
                setEditingVolunteer({ ...editingVolunteer, statut: e.target.value })
              }
              className="border px-3 py-2 mb-4 w-full rounded"
            >
              <option>Non disponible</option>
              <option>Refusé</option>
              <option>Mission validée</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdate(editingVolunteer)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Attribution Mission */}
      {assigningMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl mb-4 font-bold text-green-600">
              Attribuer une mission à{" "}
              {assigningMission.fullName ||
                `${assigningMission.nom} ${assigningMission.prenom}`}
            </h2>
            <input
              type="text"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="Titre de la mission"
              className="border px-3 py-2 mb-4 w-full rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setAssigningMission(null);
                  setMissionTitle("");
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignConfirm}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Attribuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
