// src/components/admin/VolunteerApplicationsInbox.jsx
// Remplace VolunteerManager.jsx (boîte "Demandes de volontariat"). Les
// candidatures rattachées à un programme précis se gèrent désormais dans
// l'onglet "Candidatures" de VolunteerProgramEditor — cette boîte se
// concentre sur les candidatures SPONTANÉES (sans programme précis), qui
// n'ont pas d'autre écran de gestion.
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const STATUS_LABELS = { PENDING: "En attente", ACCEPTED: "Acceptée", REJECTED: "Rejetée" };

const formatResponseValue = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
};

export default function VolunteerApplicationsInbox() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await adminFetch("/api/volunteer-applications?programId=spontaneous");
      setApplications(data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const review = async (id, action) => {
    try {
      await adminFetch(`/api/volunteer-applications/${id}/${action}`, { method: "PATCH" });
      setSelectedId(null);
      fetchApplications();
    } catch (err) {
      alert(err.message);
    }
  };

  const selected = applications.find((a) => a._id === selectedId) || null;
  const responseEntries = selected ? Object.entries(selected.responses || {}) : [];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-1">Candidatures spontanées</h2>
      <p className="text-sm text-gray-500 mb-3">
        Volontaires ayant manifesté leur intérêt sans postuler à un programme précis. Les candidatures
        rattachées à un programme se gèrent depuis la fiche de ce programme (onglet "Candidatures").
      </p>
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-500">Aucune candidature spontanée pour l'instant.</p>
      ) : (
        <div style={{ maxHeight: 500, overflow: "auto" }}>
          {applications.map((a) => (
            <div key={a._id} onClick={() => setSelectedId(a._id)}
              className="border-b py-2 flex justify-between cursor-pointer hover:bg-gray-50">
              <div>
                <div><strong>{a.applicantFirstName} {a.applicantLastName}</strong> — {a.applicantEmail}</div>
                <div className="text-sm text-gray-500">{a.applicantPhone || "—"}</div>
              </div>
              <div className={`self-center px-2 py-1 rounded-full text-xs font-bold ${
                a.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                a.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
              }`}>
                {STATUS_LABELS[a.status]}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">{selected.applicantFirstName} {selected.applicantLastName}</h3>
            <dl className="text-sm space-y-1 mb-4">
              <div><dt className="inline font-semibold">Email : </dt><dd className="inline">{selected.applicantEmail}</dd></div>
              <div><dt className="inline font-semibold">Téléphone : </dt><dd className="inline">{selected.applicantPhone || "—"}</dd></div>
              {responseEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="inline font-semibold">{key} : </dt>
                  <dd className="inline">{formatResponseValue(value)}</dd>
                </div>
              ))}
            </dl>
            {selected.status === "PENDING" ? (
              <div className="flex gap-3">
                <button onClick={() => review(selected._id, "accept")}
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700">
                  Accepter
                </button>
                <button onClick={() => review(selected._id, "reject")}
                  className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700">
                  Rejeter
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Statut : {STATUS_LABELS[selected.status]}</p>
            )}
            <button onClick={() => setSelectedId(null)} className="mt-3 text-sm text-gray-500 hover:underline">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
