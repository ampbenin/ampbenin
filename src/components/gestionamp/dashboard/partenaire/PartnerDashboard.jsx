// src/components/gestionamp/dashboard/partenaire/PartnerDashboard.jsx
// Tableau de bord PARTENAIRE : lecture seule des statistiques/impact d'un
// ou plusieurs programmes suivis — jamais les tâches rejetées/en attente,
// uniquement les volontaires à "Mission validée" et leurs tâches
// APPROUVÉES (voir controllers/volunteerProgramPartnerController.js).
// Utilise adminFetch (chemins complets) — ces routes vivent hors du
// sous-système gestionamp (/api/volunteer-partner, pas /gestionamp/api).
//
// Enrichi le 2026-08-05 : en-tête co-brandé (logo du partenaire),
// phrase d'impact, galerie photo (dérivée des preuves déjà chargées,
// aucun appel réseau supplémentaire), graphique de progression dans le
// temps (chart.js, utilisé ici de façon impérative — pas de wrapper React
// installé dans ce projet), export PDF du rapport, historique des
// commentaires avec réponse de l'équipe.
//
// Enrichi le 2026-08-06 : liste des candidatures du programme (recherche +
// filtres, même logique que la vue staff), mais strictement lecture seule —
// jamais les rejetées (contiennent les coordonnées de personnes non
// retenues), pas de checkbox, pas de bouton d'action. Restreint côté
// serveur (listPartnerApplications), pas seulement par absence d'UI ici.
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import ReportVolunteerButton from "@/components/admin/ReportVolunteerButton.jsx";
import { findBlacklistMatch, BlacklistBadge } from "@/components/admin/BlacklistWarning.jsx";
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

function ImpactChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "Tâches approuvées",
            data: data.map((d) => d.count),
            backgroundColor: "#1B4332",
            borderRadius: 6,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  if (!data || data.length === 0) {
    return <p style={{ color: "#666" }}>Pas encore assez de données pour afficher un graphique.</p>;
  }

  return (
    <div style={{ height: 220 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function PartnerDashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [myComments, setMyComments] = useState([]);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [downloadingReport, setDownloadingReport] = useState(false);

  // Candidatures du programme — lecture seule (jamais les rejetées, voir
  // controllers/volunteerProgramPartnerController.js#listPartnerApplications
  // : restreint côté serveur, pas seulement par absence de bouton ici).
  // Mêmes filtres/recherche/pagination que la vue staff.
  const [applications, setApplications] = useState([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationFilters, setApplicationFilters] = useState({ status: "", dateFrom: "", dateTo: "" });
  const [fieldFilterValues, setFieldFilterValues] = useState({});
  const [showApplicationFiltersMenu, setShowApplicationFiltersMenu] = useState(false);

  // Liste noire des volontaires bannis — chargée une fois, croisée côté
  // client sur les candidatures affichées (voir BlacklistWarning.jsx).
  const [blacklist, setBlacklist] = useState([]);

  const loadPrograms = async () => {
    try {
      const res = await adminFetch("/api/volunteer-partner/my-programs");
      setPrograms(res?.items || []);
      if (res?.items?.length > 0) setSelectedProgramId(res.items[0]._id);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadMe = async () => {
    try {
      const res = await adminFetch("/gestionamp/api/auth/me");
      setMe(res);
    } catch (err) {
      console.error("Erreur chargement profil partenaire", err);
    }
  };

  const loadStats = async (programId) => {
    if (!programId) return;
    try {
      const res = await adminFetch(`/api/volunteer-partner/programs/${programId}/stats`);
      setData(res);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    }
  };

  const loadMyComments = async (programId) => {
    if (!programId) return;
    try {
      const res = await adminFetch(`/api/volunteer-partner/programs/${programId}/my-comments`);
      setMyComments(res?.items || []);
    } catch (err) {
      console.error("Erreur chargement commentaires", err);
    }
  };

  const loadApplications = async (page = 1) => {
    if (!selectedProgramId) return;
    setApplicationsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (applicationFilters.status) params.set("status", applicationFilters.status);
      if (applicationFilters.dateFrom) params.set("dateFrom", applicationFilters.dateFrom);
      if (applicationFilters.dateTo) params.set("dateTo", applicationFilters.dateTo);
      if (applicationSearch.trim()) params.set("search", applicationSearch.trim());

      // Les réponses CHECKBOX sont stockées en base comme de vrais booléens
      // (pas les chaînes "true"/"false" que renvoie le <select>).
      const customFields = data?.program?.applicationFormFields || [];
      const fieldsById = new Map(customFields.map((f) => [f.id, f]));
      const activeFieldFilters = Object.fromEntries(
        Object.entries(fieldFilterValues)
          .filter(([, v]) => v !== "" && v !== undefined && v !== null)
          .map(([fieldId, v]) => [fieldId, fieldsById.get(fieldId)?.type === "CHECKBOX" ? v === "true" : v])
      );
      if (Object.keys(activeFieldFilters).length > 0) params.set("fieldFilters", JSON.stringify(activeFieldFilters));

      const res = await adminFetch(`/api/volunteer-partner/programs/${selectedProgramId}/applications?${params.toString()}`);
      setApplications(res?.items || []);
      setApplicationsTotal(res?.total || 0);
      setApplicationsTotalPages(res?.totalPages || 1);
      setApplicationsPage(page);
    } catch (err) {
      console.error("Erreur chargement candidatures", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadBlacklist = async () => {
    try {
      const res = await adminFetch("/api/volunteer-discipline/blacklist");
      setBlacklist(res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPrograms();
    loadMe();
    loadBlacklist();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    loadStats(selectedProgramId);
    loadMyComments(selectedProgramId);
    setComment("");
    setApplicationSearch("");
    setApplicationFilters({ status: "", dateFrom: "", dateTo: "" });
    setFieldFilterValues({});
  }, [selectedProgramId]);

  // Rechargement débouncé (350 ms) à chaque changement de filtre/recherche.
  useEffect(() => {
    if (!selectedProgramId) return;
    const timeout = setTimeout(() => loadApplications(1), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramId, applicationSearch, applicationFilters, fieldFilterValues]);

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("amp_token");
      const res = await fetch(`${API_BASE}/api/volunteer-partner/me/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Erreur lors de l'envoi du logo");
      setMe((prev) => ({ ...prev, partnerLogoUrl: body.url }));
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi du logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await adminFetch(`/api/volunteer-partner/programs/${selectedProgramId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: comment.trim() }),
      });
      setComment("");
      loadMyComments(selectedProgramId);
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmittingComment(false);
    }
  };

  const downloadReport = async () => {
    setDownloadingReport(true);
    try {
      const token = localStorage.getItem("amp_token");
      const res = await fetch(`${API_BASE}/api/volunteer-partner/programs/${selectedProgramId}/report.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la génération du rapport");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-impact-${(data?.program?.title || "programme").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Erreur lors du téléchargement du rapport");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Galerie photo : dérivée des preuves de type IMAGE déjà chargées dans
  // `data.validatedVolunteers` — aucun appel réseau supplémentaire.
  const gallery = useMemo(() => {
    if (!data?.validatedVolunteers) return [];
    const photos = [];
    data.validatedVolunteers.forEach((v) => {
      (v.approvedTasks || []).forEach((t) => {
        (t.proofFields || []).forEach((f) => {
          if (f.type !== "IMAGE") return;
          const urls = t.responses?.[f.id];
          if (!Array.isArray(urls)) return;
          urls.forEach((url) => {
            photos.push({ url, volunteerName: `${v.prenom} ${v.nom}`, taskTitle: t.taskTitle });
          });
        });
      });
    });
    return photos;
  }, [data]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;
  if (programs.length === 0) return <p>Aucun programme ne vous est associé pour l'instant.</p>;
  if (!data) return <p>Chargement des statistiques...</p>;

  const { program, stats, validatedVolunteers, progressOverTime } = data;

  return (
    <div className="partner-dashboard">
      {/* En-tête co-brandé */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {me?.partnerLogoUrl ? (
          <img
            src={me.partnerLogoUrl}
            alt="Logo"
            style={{ height: 56, width: 56, borderRadius: 12, objectFit: "cover", border: "1px solid #ddd" }}
          />
        ) : (
          <div
            style={{
              height: 56, width: 56, borderRadius: 12, background: "#1B4332", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700,
            }}
          >
            {(me?.name || "P")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0 }}>Tableau de bord — {me?.name || "Partenaire"} × AMP BENIN</h2>
          <label style={{ fontSize: "0.8rem", color: "#1B4332", cursor: "pointer", textDecoration: "underline" }}>
            {uploadingLogo ? "Envoi..." : "Changer mon logo"}
            <input type="file" accept="image/*" onChange={uploadLogo} disabled={uploadingLogo} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          Programme suivi :{" "}
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </label>
      </div>

      {/* Phrase d'impact */}
      <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1B4332", marginBottom: 24 }}>
        Grâce à votre soutien, {stats.validatedVolunteers} volontaire(s) ont validé leur mission et
        accompli {stats.totalApprovedTasks} tâche(s) sur le terrain.
      </p>

      {/* Galerie photo */}
      <section style={{ marginBottom: 28 }}>
        <h3>Aperçu en images ({gallery.length})</h3>
        {gallery.length === 0 ? (
          <p style={{ color: "#666" }}>Aucune photo pour l'instant.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {gallery.map((photo, i) => (
              <a key={i} href={photo.url} target="_blank" rel="noreferrer" title={`${photo.volunteerName} — ${photo.taskTitle}`}>
                <img
                  src={photo.url}
                  alt={photo.taskTitle}
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
                />
              </a>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3>Chiffres clés</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            ["Volontaires acceptés", stats.totalVolunteers],
            ["Mission validée", `${stats.validatedVolunteers} (${stats.percentValidated}%)`],
            ["Progression moyenne", `${stats.averageProgress}%`],
            ["Tâches approuvées", stats.totalApprovedTasks],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "12px 16px", minWidth: 140 }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3>Candidatures reçues ({applicationsTotal})</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "flex-end" }}>
          <input
            type="text"
            placeholder="Rechercher (nom, email, téléphone)..."
            value={applicationSearch}
            onChange={(e) => setApplicationSearch(e.target.value)}
            style={{ flex: "1 1 220px", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <div style={{ position: "relative" }}>
            {(() => {
              const activeCount =
                (applicationFilters.status ? 1 : 0) +
                (applicationFilters.dateFrom ? 1 : 0) +
                (applicationFilters.dateTo ? 1 : 0) +
                Object.values(fieldFilterValues).filter(Boolean).length;
              return (
                <>
                  <button
                    onClick={() => setShowApplicationFiltersMenu((v) => !v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
                      border: activeCount > 0 ? "1px solid #C9903A" : "1px solid #ccc",
                      background: activeCount > 0 ? "#FDF4E7" : "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                    }}
                  >
                    🎛️ Filtres
                    {activeCount > 0 && (
                      <span style={{ background: "#C9903A", color: "#fff", borderRadius: 999, fontSize: "0.7rem", padding: "1px 6px" }}>{activeCount}</span>
                    )}
                    <span style={{ fontSize: "0.7rem" }}>{showApplicationFiltersMenu ? "▲" : "▼"}</span>
                  </button>

                  {showApplicationFiltersMenu && (
                    <div style={{
                      position: "absolute", right: 0, zIndex: 10, marginTop: 4, width: 280, background: "#fff",
                      border: "1px solid #ddd", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 16,
                      display: "flex", flexDirection: "column", gap: 12,
                    }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: 4 }}>Statut</label>
                        <select value={applicationFilters.status}
                          onChange={(e) => setApplicationFilters((prev) => ({ ...prev, status: e.target.value }))}
                          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}>
                          <option value="">Toutes</option>
                          <option value="PENDING">En attente</option>
                          <option value="ACCEPTED">Acceptée</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: 4 }}>Reçue depuis</label>
                          <input type="date" value={applicationFilters.dateFrom}
                            onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: 4 }}>Jusqu'au</label>
                          <input type="date" value={applicationFilters.dateTo}
                            onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }} />
                        </div>
                      </div>
                      {(program.applicationFormFields || []).filter((f) => f.type === "SELECT" || f.type === "CHECKBOX").map((f) => (
                        <div key={f.id}>
                          <label style={{ fontSize: "0.75rem", color: "#666", display: "block", marginBottom: 4 }}>{f.label}</label>
                          <select value={fieldFilterValues[f.id] || ""}
                            onChange={(e) => setFieldFilterValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}>
                            <option value="">Toutes</option>
                            {f.type === "CHECKBOX" ? (
                              <>
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                              </>
                            ) : (
                              f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)
                            )}
                          </select>
                        </div>
                      ))}
                      {activeCount > 0 && (
                        <button
                          onClick={() => { setApplicationFilters({ status: "", dateFrom: "", dateTo: "" }); setFieldFilterValues({}); }}
                          style={{ background: "none", border: "none", color: "#dc2626", fontSize: "0.8rem", textAlign: "left", cursor: "pointer", padding: 0 }}
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {applicationsLoading ? (
          <p style={{ color: "#666" }}>Chargement...</p>
        ) : applications.length === 0 ? (
          <p style={{ color: "#666" }}>Aucune candidature ne correspond à ces critères.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#F5F0E8", textAlign: "left" }}>
                    <th style={{ padding: 8, border: "1px solid #ddd" }}>Candidat</th>
                    <th style={{ padding: 8, border: "1px solid #ddd" }}>Email</th>
                    <th style={{ padding: 8, border: "1px solid #ddd" }}>Téléphone</th>
                    <th style={{ padding: 8, border: "1px solid #ddd" }}>Statut</th>
                    <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => {
                    const blacklistEntry = findBlacklistMatch(blacklist, {
                      email: a.applicantEmail, phone: a.applicantPhone,
                      firstName: a.applicantFirstName, lastName: a.applicantLastName,
                    });
                    return (
                    <tr key={a._id} style={blacklistEntry ? { background: "#FFE8EA" } : undefined}>
                      <td style={{ padding: 8, border: "1px solid #eee" }}>
                        {a.applicantFirstName} {a.applicantLastName}
                        {blacklistEntry && <BlacklistBadge entry={blacklistEntry} />}
                      </td>
                      <td style={{ padding: 8, border: "1px solid #eee" }}>{a.applicantEmail}</td>
                      <td style={{ padding: 8, border: "1px solid #eee" }}>{a.applicantPhone || "—"}</td>
                      <td style={{ padding: 8, border: "1px solid #eee" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700,
                          background: a.status === "ACCEPTED" ? "#D8F3E3" : "#FDF4E7",
                          color: a.status === "ACCEPTED" ? "#2D6A4F" : "#A87028",
                        }}>
                          {a.status === "ACCEPTED" ? "Acceptée" : "En attente"}
                        </span>
                      </td>
                      <td style={{ padding: 8, border: "1px solid #eee" }}>
                        <ReportVolunteerButton programId={selectedProgramId} applicationId={a._id} />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: "0.85rem" }}>
              <button onClick={() => loadApplications(applicationsPage - 1)} disabled={applicationsPage <= 1}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: applicationsPage <= 1 ? "not-allowed" : "pointer", opacity: applicationsPage <= 1 ? 0.4 : 1 }}>
                ← Précédent
              </button>
              <span style={{ color: "#666" }}>Page {applicationsPage} / {applicationsTotalPages} — {applicationsTotal} candidature(s)</span>
              <button onClick={() => loadApplications(applicationsPage + 1)} disabled={applicationsPage >= applicationsTotalPages}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: applicationsPage >= applicationsTotalPages ? "not-allowed" : "pointer", opacity: applicationsPage >= applicationsTotalPages ? 0.4 : 1 }}>
                Suivant →
              </button>
            </div>
          </>
        )}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3>Progression dans le temps</h3>
        <ImpactChart data={progressOverTime} />
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>{program.title}</h2>
        {program.description && <p style={{ color: "#555", marginBottom: 4 }}>{program.description}</p>}
        <p style={{ fontSize: "0.85rem", color: "#777" }}>
          {program.location && <>📍 {program.location} · </>}
          {program.startDate && <>Début : {new Date(program.startDate).toLocaleDateString("fr-FR")}</>}
          {program.endDate && <> · Fin : {new Date(program.endDate).toLocaleDateString("fr-FR")}</>}
        </p>
        <button
          onClick={downloadReport}
          disabled={downloadingReport}
          style={{ marginTop: 8, background: "#C9903A", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}
        >
          {downloadingReport ? "Génération..." : "📄 Télécharger le rapport PDF"}
        </button>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3>Volontaires à mission validée ({validatedVolunteers.length})</h3>
        {validatedVolunteers.length === 0 ? (
          <p style={{ color: "#666" }}>Aucun volontaire n'a encore validé sa mission sur ce programme.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {validatedVolunteers.map((v) => (
              <details key={v.volunteerId} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span>{v.prenom} {v.nom} — {v.approvedTasks.length} tâche(s) approuvée(s)</span>
                  <ReportVolunteerButton programId={selectedProgramId} volunteerId={v.volunteerId} />
                </summary>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {v.approvedTasks.map((t, i) => (
                    <div key={i} style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
                      <strong>{t.taskTitle}</strong>
                      {t.occurrenceDate && (
                        <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: 8 }}>
                          ({new Date(t.occurrenceDate).toLocaleDateString("fr-FR")})
                        </span>
                      )}
                      <dl style={{ fontSize: "0.9rem", marginTop: 4 }}>
                        {(t.proofFields || []).map((f) => {
                          const value = t.responses?.[f.id];
                          if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
                          return (
                            <div key={f.id}>
                              <dt style={{ display: "inline", fontWeight: 600 }}>{f.label} : </dt>
                              <dd style={{ display: "inline" }}>
                                {f.type === "URL" ? (
                                  <a href={value} target="_blank" rel="noreferrer">{value}</a>
                                ) : f.type === "IMAGE" ? (
                                  <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                                    {value.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                                        <img src={url} alt="" style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 6 }} />
                                      </a>
                                    ))}
                                  </span>
                                ) : f.type === "CHECKBOX" ? (value ? "Oui" : "Non") : String(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3>Vos échanges avec l'équipe AMP BENIN</h3>
        {myComments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {myComments.map((c) => (
              <div key={c._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 4 }}>
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </div>
                <p style={{ margin: "0 0 8px", whiteSpace: "pre-line" }}>{c.text}</p>
                {c.reply ? (
                  <div style={{ background: "#F5F0E8", borderRadius: 6, padding: 8, fontSize: "0.9rem" }}>
                    <strong>Réponse de l'équipe</strong>
                    {c.repliedAt && <span style={{ fontSize: "0.7rem", color: "#888", marginLeft: 6 }}>({new Date(c.repliedAt).toLocaleDateString("fr-FR")})</span>}
                    <p style={{ margin: "4px 0 0", whiteSpace: "pre-line" }}>{c.reply}</p>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>En attente de réponse</p>
                )}
              </div>
            ))}
          </div>
        )}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Suggestion, remarque, question..."
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button onClick={submitComment} disabled={submittingComment || !comment.trim()}
          style={{ marginTop: 8, background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>
          {submittingComment ? "Envoi..." : "Envoyer"}
        </button>
      </section>
    </div>
  );
}
