// src/components/admin/DisciplineManager.jsx
// Espace ADMIN (uniquement) de traitement des signalements de volontaires
// "indélicats" — voir controllers/volunteerDisciplineController.js.
// Un ADMIN peut traiter un signalement (avertissement/suspension/
// bannissement, ou classer sans suite) OU sanctionner directement un
// volontaire choisi librement, sans signalement préalable (décision
// confirmée avec l'utilisateur).
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const SANCTION_LABELS = { WARNING: "Avertissement", SUSPENSION: "Suspension", BAN: "Bannissement" };

function SanctionForm({ volunteerId, volunteerName, reportId, onDone, onCancel }) {
  const [type, setType] = useState("WARNING");
  const [reason, setReason] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    if (type === "SUSPENSION" && !suspendedUntil) { alert("Choisissez une date de fin de suspension."); return; }
    if (type === "BAN" && !confirm(`Bannir définitivement ${volunteerName || "ce volontaire"} ? Son compte sera supprimé et archivé dans la liste noire.`)) return;

    setSubmitting(true);
    try {
      await adminFetch("/api/volunteer-discipline/sanctions", {
        method: "POST",
        body: JSON.stringify({
          volunteerId, type, reason: reason.trim(),
          suspendedUntil: type === "SUSPENSION" ? new Date(suspendedUntil).toISOString() : undefined,
          reportId: reportId || undefined,
        }),
      });
      onDone();
    } catch (err) {
      alert(err.message || "Erreur lors de l'application de la sanction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 8, background: "#fafafa" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {Object.entries(SANCTION_LABELS).map(([value, label]) => (
          <label key={value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" }}>
            <input type="radio" name={`type-${volunteerName}`} checked={type === value} onChange={() => setType(value)} />
            {label}
          </label>
        ))}
      </div>
      {type === "SUSPENSION" && (
        <input type="date" value={suspendedUntil} onChange={(e) => setSuspendedUntil(e.target.value)}
          style={{ display: "block", marginBottom: 8, padding: 6, border: "1px solid #ccc", borderRadius: 6 }} />
      )}
      <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Motif (obligatoire, visible par le volontaire et envoyé par email)"
        style={{ width: "100%", padding: 6, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={submit} disabled={submitting || !reason.trim()} style={{
          background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px",
          fontWeight: 700, cursor: "pointer", opacity: submitting || !reason.trim() ? 0.6 : 1,
        }}>
          {submitting ? "Envoi..." : "Appliquer la sanction"}
        </button>
        <button onClick={onCancel} style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function DisciplineManager() {
  const [reports, setReports] = useState([]);
  const [activeSanctions, setActiveSanctions] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sanctioningReportId, setSanctioningReportId] = useState(null); // report en cours de traitement
  const [sanctioningVolunteer, setSanctioningVolunteer] = useState(null); // {id, name} pour sanction directe

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reportsRes, sanctionsRes, blacklistRes] = await Promise.all([
        adminFetch("/api/volunteer-discipline/reports?status=PENDING"),
        adminFetch("/api/volunteer-discipline/sanctions/active"),
        adminFetch("/api/volunteer-discipline/blacklist"),
      ]);
      setReports(reportsRes?.items || []);
      setActiveSanctions(sanctionsRes?.items || []);
      setBlacklist(blacklistRes?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const dismissReport = async (id) => {
    if (!confirm("Classer ce signalement sans suite ?")) return;
    try {
      await adminFetch(`/api/volunteer-discipline/reports/${id}/dismiss`, { method: "PATCH" });
      loadAll();
    } catch (err) {
      alert(err.message || "Erreur");
    }
  };

  const liftSanction = async (id) => {
    const liftReason = window.prompt("Motif de la levée (optionnel) :") || "";
    try {
      await adminFetch(`/api/volunteer-discipline/sanctions/${id}/lift`, {
        method: "PATCH", body: JSON.stringify({ liftReason }),
      });
      loadAll();
    } catch (err) {
      alert(err.message || "Erreur lors de la levée");
    }
  };

  const runSearch = async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await adminFetch(`/api/volunteers?search=${encodeURIComponent(search.trim())}`);
      setSearchResults(res?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Discipline & sanctions</h2>
        <p className="text-sm text-gray-500">
          Signalements soumis par le staff (ADMIN/EDITOR/SUPERVISEUR/PARTENAIRE), sanctions actives, et liste noire
          des volontaires bannis.
        </p>
      </div>

      {/* Signalements en attente */}
      <div>
        <h3 className="font-semibold mb-3">Signalements en attente ({reports.length})</h3>
        {reports.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun signalement en attente.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className="border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between flex-wrap gap-2">
                  <div>
                    <strong>{r.volunteer?.prenom} {r.volunteer?.nom}</strong>
                    <span className="text-gray-500 text-sm"> ({r.volunteer?.email})</span>
                    <div className="text-xs text-gray-500 mt-1">
                      Signalé par {r.reportedByName} ({r.reportedByRole}) — {r.programTitle} — {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-line">{r.reason}</p>
                  </div>
                  <div className="flex gap-2 items-start flex-shrink-0">
                    <button onClick={() => setSanctioningReportId(sanctioningReportId === r._id ? null : r._id)}
                      className="bg-orange-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-orange-700">
                      Traiter
                    </button>
                    <button onClick={() => dismissReport(r._id)}
                      className="bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-gray-300">
                      Classer sans suite
                    </button>
                  </div>
                </div>
                {sanctioningReportId === r._id && (
                  <SanctionForm
                    volunteerId={r.volunteer?._id}
                    volunteerName={`${r.volunteer?.prenom} ${r.volunteer?.nom}`}
                    reportId={r._id}
                    onDone={() => { setSanctioningReportId(null); loadAll(); }}
                    onCancel={() => setSanctioningReportId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sanction directe */}
      <div>
        <h3 className="font-semibold mb-3">Sanctionner directement un volontaire</h3>
        <div className="flex gap-2 mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Rechercher par nom, prénom ou email..."
            className="flex-1 border border-gray-300 rounded-xl p-2" />
          <button onClick={runSearch} disabled={searching} className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl hover:bg-gray-800">
            {searching ? "..." : "Rechercher"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((v) => (
              <div key={v._id} className="border border-gray-200 rounded-lg p-2 text-sm">
                <div className="flex justify-between items-center">
                  <div><strong>{v.fullName || `${v.prenom} ${v.nom}`}</strong> <span className="text-gray-500">({v.email})</span></div>
                  <button
                    onClick={() => setSanctioningVolunteer(sanctioningVolunteer?.id === v._id ? null : { id: v._id, name: v.fullName || `${v.prenom} ${v.nom}` })}
                    className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-orange-700">
                    Sanctionner
                  </button>
                </div>
                {sanctioningVolunteer?.id === v._id && (
                  <SanctionForm
                    volunteerId={v._id}
                    volunteerName={sanctioningVolunteer.name}
                    onDone={() => { setSanctioningVolunteer(null); loadAll(); }}
                    onCancel={() => setSanctioningVolunteer(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sanctions actives */}
      <div>
        <h3 className="font-semibold mb-3">Sanctions actives ({activeSanctions.length})</h3>
        {activeSanctions.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune sanction active.</p>
        ) : (
          <div className="space-y-2">
            {activeSanctions.map((s) => (
              <div key={s._id} className="border border-gray-200 rounded-lg p-2 text-sm flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold mr-2 ${
                    s.type === "WARNING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {SANCTION_LABELS[s.type]}
                  </span>
                  <strong>{s.volunteerId?.prenom} {s.volunteerId?.nom}</strong>
                  <span className="text-gray-500"> ({s.volunteerId?.email})</span>
                  {s.suspendedUntil && <span className="text-gray-500"> — jusqu'au {new Date(s.suspendedUntil).toLocaleDateString("fr-FR")}</span>}
                  <p className="text-xs text-gray-500 mt-1">{s.reason}</p>
                </div>
                <button onClick={() => liftSanction(s._id)} className="text-blue-600 hover:underline text-xs flex-shrink-0">
                  Lever la sanction
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste noire */}
      <div>
        <h3 className="font-semibold mb-3">Liste noire — volontaires bannis ({blacklist.length})</h3>
        {blacklist.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun volontaire banni.</p>
        ) : (
          <div className="space-y-2">
            {blacklist.map((b) => (
              <div key={b._id} className="border border-red-200 bg-red-50 rounded-lg p-2 text-sm flex justify-between items-center flex-wrap gap-2">
                <div>
                  <strong>{b.prenom} {b.nom}</strong>
                  <span className="text-gray-500"> ({b.email}{b.telephone ? `, ${b.telephone}` : ""})</span>
                  <div className="text-xs text-gray-500 mt-1">Banni le {new Date(b.bannedAt).toLocaleDateString("fr-FR")}</div>
                  <p className="text-xs mt-1">{b.reason}</p>
                </div>
                {b.sanctionId && (
                  <button onClick={() => liftSanction(b.sanctionId)} className="text-blue-600 hover:underline text-xs flex-shrink-0">
                    Lever le bannissement
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
