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
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/services/admin/api";
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

  useEffect(() => {
    loadPrograms();
    loadMe();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    loadStats(selectedProgramId);
    loadMyComments(selectedProgramId);
    setComment("");
  }, [selectedProgramId]);

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
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {v.prenom} {v.nom} — {v.approvedTasks.length} tâche(s) approuvée(s)
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
