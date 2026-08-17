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
//
// Refonte visuelle premium le 2026-08-07 : l'espace utilisait les classes
// globales de GestionAMPLayout.astro (.dashboard-section button {color:
// var(--col-white)}) — plusieurs boutons ici fixaient un fond blanc en
// style inline SANS fixer de couleur de texte, héritant donc du blanc
// global → texte invisible sur fond blanc (pagination, "Annuler" du
// signalement, filtres). Corrigé en abandonnant les styles inline ad-hoc
// au profit d'une feuille de style scopée à ce composant (classes `pd-*`,
// chaque bouton fixe explicitement sa couleur), avec un habillage premium
// (dégradés de marque, cartes animées, compteurs, accordéon fluide) —
// réutilise les tokens de marque (var(--col-*)) de tokens.css, chargé
// globalement par GestionAMPLayout.astro.
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import ReportVolunteerButton from "@/components/admin/ReportVolunteerButton.jsx";
import { findBlacklistMatch, BlacklistBadge } from "@/components/admin/BlacklistWarning.jsx";
// jsPDF + jspdf-autotable déjà utilisés dans ce projet (voir
// VolunteersManager.jsx#exportPDF) — réutilisés ici pour l'export
// "Volontaires à mission validée" en A4 paysage, classés par progression
// (décision utilisateur, 2026-08-17, appliquée en parallèle sur les
// espaces SUPERVISEUR et ADMIN).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

// Compteur animé (0 → valeur cible, easing cubique) — aucune dépendance
// supplémentaire, juste requestAnimationFrame.
function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const to = Number(value) || 0;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
}

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
            hoverBackgroundColor: "#2D6A4F",
            borderRadius: 8,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeOutQuart" },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#EEEAE3" } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  if (!data || data.length === 0) {
    return <p className="pd-muted">Pas encore assez de données pour afficher un graphique.</p>;
  }

  return (
    <div className="pd-chart">
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

  // Logo AMP BENIN — réglage global piloté depuis l'espace ADMIN (voir
  // SiteSettingsManager.jsx), affiché à côté du logo du partenaire dans
  // l'en-tête co-brandé. null tant que l'ADMIN n'en a pas défini un —
  // aucune image de repli forcée, la mise en page s'adapte à son absence.
  const [ampLogoUrl, setAmpLogoUrl] = useState(null);
  // Barre des partenaires : PAS un état séparé — propre à CHAQUE
  // PROGRAMME (corrigé le 2026-08-07 : d'abord un réglage global comme le
  // logo AMP BENIN, l'utilisateur a précisé "c'est une image propre à
  // chaque programme, seuls les partenaires où ce programme a été affecté
  // verront ça"), donc lue directement depuis `data.program.partnersBarImageUrl`
  // (déjà chargé par loadStats) plutôt que depuis /api/site-settings.

  const [myComments, setMyComments] = useState([]);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingBeneficiaries, setDownloadingBeneficiaries] = useState(false);
  // Décochée par défaut (décision utilisateur, 2026-08-07) : la liste des
  // bénéficiaires n'apparaît dans le rapport complet que si explicitement
  // demandée.
  const [includeBeneficiaries, setIncludeBeneficiaries] = useState(false);

  // Accordéon des volontaires validés (fluide, voir .pd-acc dans le CSS).
  const [openVolunteers, setOpenVolunteers] = useState(() => new Set());
  const toggleVolunteer = (id) => {
    setOpenVolunteers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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

  const loadSiteSettings = async () => {
    try {
      const res = await adminFetch("/api/site-settings");
      setAmpLogoUrl(res?.ampLogoUrl || null);
    } catch (err) {
      console.error("Erreur chargement réglages du site", err);
    }
  };

  useEffect(() => {
    loadPrograms();
    loadMe();
    loadBlacklist();
    loadSiteSettings();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    loadStats(selectedProgramId);
    loadMyComments(selectedProgramId);
    setComment("");
    setApplicationSearch("");
    setApplicationFilters({ status: "", dateFrom: "", dateTo: "" });
    setFieldFilterValues({});
    setOpenVolunteers(new Set());
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

  // downloadPdf() est partagé par les 2 boutons de téléchargement (rapport
  // complet / liste des bénéficiaires seule) — même endpoint côté serveur,
  // seuls les query params et le préfixe de nom de fichier changent (voir
  // controllers/volunteerProgramPartnerController.js#downloadImpactReport).
  const downloadPdf = async ({ query, filenamePrefix, setDownloading }) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("amp_token");
      const url = `${API_BASE}/api/volunteer-partner/programs/${selectedProgramId}/report.pdf${query}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erreur lors de la génération du rapport");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${filenamePrefix}-${(data?.program?.title || "programme").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.message || "Erreur lors du téléchargement du rapport");
    } finally {
      setDownloading(false);
    }
  };

  const downloadReport = () => downloadPdf({
    query: includeBeneficiaries ? "?includeBeneficiaries=true" : "",
    filenamePrefix: "rapport-impact",
    setDownloading: setDownloadingReport,
  });

  const downloadBeneficiariesList = () => downloadPdf({
    query: "?onlyBeneficiaries=true",
    filenamePrefix: "liste-beneficiaires",
    setDownloading: setDownloadingBeneficiaries,
  });

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

  if (loading) {
    return (
      <div className="pd-state">
        <div className="pd-spinner" />
        <p>Chargement de votre espace partenaire...</p>
        <style>{PD_STYLES}</style>
      </div>
    );
  }
  if (error) {
    return (
      <div className="pd-state pd-state--error">
        <span className="pd-state__icon">⚠️</span>
        <p>{error}</p>
        <style>{PD_STYLES}</style>
      </div>
    );
  }
  if (programs.length === 0) {
    return (
      <div className="pd-state">
        <span className="pd-state__icon">🤝</span>
        <p>Aucun programme ne vous est associé pour l'instant.</p>
        <style>{PD_STYLES}</style>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="pd-state">
        <div className="pd-spinner" />
        <p>Chargement des statistiques...</p>
        <style>{PD_STYLES}</style>
      </div>
    );
  }

  const { program, stats, validatedVolunteers, progressOverTime } = data;
  // Classement "Volontaires à mission validée" du meilleur au moins
  // avancé — copie, ne mute jamais l'ordre d'origine de validatedVolunteers.
  const rankedValidatedVolunteers = [...validatedVolunteers].sort((a, b) => b.progress.percent - a.progress.percent);

  const exportValidatedVolunteersPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    doc.text(`Volontaires à mission validée — ${program.title}`, 14, 14);
    autoTable(doc, {
      head: [["Rang", "Nom", "Progression", "Tâches approuvées"]],
      body: rankedValidatedVolunteers.map((v, i) => [
        i + 1,
        `${v.prenom} ${v.nom}`,
        `${v.progress.approved}/${v.progress.totalDue} (${v.progress.percent}%)`,
        v.approvedTasks.length,
      ]),
      startY: 20,
    });
    const slug = program.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    doc.save(`volontaires-valides-${slug}.pdf`);
  };

  const activeFilterCount =
    (applicationFilters.status ? 1 : 0) +
    (applicationFilters.dateFrom ? 1 : 0) +
    (applicationFilters.dateTo ? 1 : 0) +
    Object.values(fieldFilterValues).filter(Boolean).length;

  const statCards = [
    { icon: "🤝", label: "Volontaires acceptés", value: stats.totalVolunteers, suffix: "" },
    { icon: "✅", label: "Mission validée", value: stats.validatedVolunteers, suffix: ` (${stats.percentValidated}%)` },
    { icon: "📈", label: "Progression moyenne", value: stats.averageProgress, suffix: "%" },
    { icon: "🗂️", label: "Tâches approuvées", value: stats.totalApprovedTasks, suffix: "" },
  ];

  return (
    <div className="pd">
      {/* En-tête co-brandé — logo AMP BENIN (réglage admin) + logo du partenaire côte à côte */}
      <div className="pd-hero">
        <div className="pd-hero__glow" aria-hidden="true" />
        <div className="pd-hero__content">
          <div className="pd-hero__logos">
            {ampLogoUrl ? (
              <img src={ampLogoUrl} alt="AMP BENIN" className="pd-hero__logo pd-hero__logo--img" />
            ) : (
              <div className="pd-hero__logo pd-hero__logo--fallback">A</div>
            )}
            <span className="pd-hero__x" aria-hidden="true">×</span>
            {me?.partnerLogoUrl ? (
              <img src={me.partnerLogoUrl} alt="Logo du partenaire" className="pd-hero__logo pd-hero__logo--img" />
            ) : (
              <div className="pd-hero__logo pd-hero__logo--fallback">{(me?.name || "P")[0].toUpperCase()}</div>
            )}
          </div>
          <div className="pd-hero__text">
            <span className="pd-hero__tag">Espace partenaire</span>
            <h2 className="pd-hero__title">{me?.name || "Partenaire"} <span className="pd-hero__x">×</span> AMP BENIN</h2>
            <label className="pd-hero__logo-link">
              {uploadingLogo ? "Envoi en cours..." : "✎ Changer mon logo"}
              <input type="file" accept="image/*" onChange={uploadLogo} disabled={uploadingLogo} className="pd-sr-only" />
            </label>
          </div>
        </div>

        <div className="pd-hero__picker">
          <label className="pd-hero__picker-label">Programme suivi</label>
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className="pd-select pd-select--hero">
            {programs.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {/* Phrase d'impact */}
      <div className="pd-impact pd-fade" style={{ "--pd-delay": "60ms" }}>
        <span className="pd-impact__mark" aria-hidden="true">”</span>
        <p>
          Grâce à votre soutien, <strong>{stats.validatedVolunteers} volontaire(s)</strong> ont validé leur mission et
          accompli <strong>{stats.totalApprovedTasks} tâche(s)</strong> sur le terrain.
        </p>
      </div>

      {/* Chiffres clés */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "100ms" }}>
        <h3 className="pd-card__title">Chiffres clés</h3>
        <div className="pd-stats">
          {statCards.map((s, i) => (
            <div key={s.label} className="pd-stat" style={{ "--pd-stat-delay": `${140 + i * 70}ms` }}>
              <span className="pd-stat__icon">{s.icon}</span>
              <div className="pd-stat__value"><AnimatedNumber value={s.value} />{s.suffix}</div>
              <div className="pd-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Galerie photo */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "140ms" }}>
        <h3 className="pd-card__title">Aperçu en images <span className="pd-count">({gallery.length})</span></h3>
        {gallery.length === 0 ? (
          <p className="pd-muted">Aucune photo pour l'instant.</p>
        ) : (
          <div className="pd-gallery">
            {gallery.map((photo, i) => (
              <a key={i} href={photo.url} target="_blank" rel="noreferrer" className="pd-gallery__item" style={{ "--pd-stat-delay": `${i * 40}ms` }}>
                <img src={photo.url} alt={photo.taskTitle} loading="lazy" />
                <span className="pd-gallery__caption">{photo.volunteerName} — {photo.taskTitle}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Liste des bénéficiaires — renommé le 2026-08-07 (décision utilisateur) :
          les candidatures reçues sur ce programme, PENDING = "Bénéficiaire
          indirect", ACCEPTED = "Bénéficiaire". Toujours restreint côté
          serveur aux mêmes statuts qu'avant (jamais les rejetées). */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "180ms" }}>
        <h3 className="pd-card__title">Liste des bénéficiaires directs et indirects <span className="pd-count">({applicationsTotal})</span></h3>

        <div className="pd-toolbar">
          <input
            type="text"
            placeholder="Rechercher (nom, email, téléphone)..."
            value={applicationSearch}
            onChange={(e) => setApplicationSearch(e.target.value)}
            className="pd-input pd-toolbar__search"
          />
          <div className="pd-filters">
            <button type="button" onClick={() => setShowApplicationFiltersMenu((v) => !v)} className={`pd-btn pd-btn--filter ${activeFilterCount > 0 ? "is-active" : ""}`}>
              🎛️ Filtres
              {activeFilterCount > 0 && <span className="pd-badge pd-badge--accent">{activeFilterCount}</span>}
              <span className={`pd-chevron ${showApplicationFiltersMenu ? "is-open" : ""}`}>▾</span>
            </button>

            {showApplicationFiltersMenu && (
              <div className="pd-filters__panel">
                <div className="pd-field">
                  <label>Statut</label>
                  <select value={applicationFilters.status}
                    onChange={(e) => setApplicationFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="pd-select">
                    <option value="">Tous</option>
                    <option value="PENDING">Bénéficiaire indirect</option>
                    <option value="ACCEPTED">Bénéficiaire</option>
                  </select>
                </div>
                <div className="pd-field-row">
                  <div className="pd-field">
                    <label>Reçue depuis</label>
                    <input type="date" value={applicationFilters.dateFrom}
                      onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                      className="pd-input" />
                  </div>
                  <div className="pd-field">
                    <label>Jusqu'au</label>
                    <input type="date" value={applicationFilters.dateTo}
                      onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                      className="pd-input" />
                  </div>
                </div>
                {(program.applicationFormFields || []).filter((f) => f.type === "SELECT" || f.type === "CHECKBOX").map((f) => (
                  <div key={f.id} className="pd-field">
                    <label>{f.label}</label>
                    <select value={fieldFilterValues[f.id] || ""}
                      onChange={(e) => setFieldFilterValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      className="pd-select">
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
                {activeFilterCount > 0 && (
                  <button type="button"
                    onClick={() => { setApplicationFilters({ status: "", dateFrom: "", dateTo: "" }); setFieldFilterValues({}); }}
                    className="pd-btn pd-btn--linklike">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {applicationsLoading ? (
          <p className="pd-muted">Chargement...</p>
        ) : applications.length === 0 ? (
          <p className="pd-muted">Aucun bénéficiaire ne correspond à ces critères.</p>
        ) : (
          <>
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => {
                    const blacklistEntry = findBlacklistMatch(blacklist, {
                      email: a.applicantEmail, phone: a.applicantPhone,
                      firstName: a.applicantFirstName, lastName: a.applicantLastName,
                    });
                    return (
                      <tr key={a._id} className={blacklistEntry ? "pd-row--flagged" : ""}>
                        <td>
                          {a.applicantFirstName} {a.applicantLastName}
                          {blacklistEntry && <BlacklistBadge entry={blacklistEntry} />}
                        </td>
                        <td>{a.applicantEmail}</td>
                        <td>{a.applicantPhone || "—"}</td>
                        <td>
                          <span className={`pd-badge ${a.status === "ACCEPTED" ? "pd-badge--success" : "pd-badge--warning"}`}>
                            {a.status === "ACCEPTED" ? "Bénéficiaire" : "Bénéficiaire indirect"}
                          </span>
                        </td>
                        <td>
                          <ReportVolunteerButton programId={selectedProgramId} applicationId={a._id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pd-pagination">
              <button type="button" onClick={() => loadApplications(applicationsPage - 1)} disabled={applicationsPage <= 1} className="pd-btn pd-btn--ghost">
                ← Précédent
              </button>
              <span className="pd-pagination__info">Page {applicationsPage} / {applicationsTotalPages} — {applicationsTotal} bénéficiaire(s)</span>
              <button type="button" onClick={() => loadApplications(applicationsPage + 1)} disabled={applicationsPage >= applicationsTotalPages} className="pd-btn pd-btn--ghost">
                Suivant →
              </button>
            </div>
          </>
        )}
      </section>

      {/* Graphique */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "220ms" }}>
        <h3 className="pd-card__title">Progression dans le temps</h3>
        <ImpactChart data={progressOverTime} />
      </section>

      {/* Programme + rapport */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "260ms" }}>
        <h2 className="pd-card__heading">{program.title}</h2>
        {program.description && <p className="pd-muted pd-program__desc">{program.description}</p>}
        <p className="pd-program__meta">
          {program.location && <>📍 {program.location} · </>}
          {program.startDate && <>Début : {new Date(program.startDate).toLocaleDateString("fr-FR")}</>}
          {program.endDate && <> · Fin : {new Date(program.endDate).toLocaleDateString("fr-FR")}</>}
        </p>
        <div className="pd-downloads">
          <label className="pd-checkbox">
            <input
              type="checkbox"
              checked={includeBeneficiaries}
              onChange={(e) => setIncludeBeneficiaries(e.target.checked)}
            />
            Inclure la liste des bénéficiaires dans le rapport
          </label>
          <div className="pd-downloads__buttons">
            <button type="button" onClick={downloadReport} disabled={downloadingReport} className="pd-btn pd-btn--accent">
              {downloadingReport ? "Génération..." : "📄 Télécharger le rapport"}
            </button>
            <button type="button" onClick={downloadBeneficiariesList} disabled={downloadingBeneficiaries} className="pd-btn pd-btn--ghost">
              {downloadingBeneficiaries ? "Génération..." : "📋 Télécharger la liste des bénéficiaires"}
            </button>
          </div>
        </div>
      </section>

      {/* Volontaires validés */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "300ms" }}>
        <div className="pd-card__header-row">
          <h3 className="pd-card__title">Volontaires à mission validée <span className="pd-count">({validatedVolunteers.length})</span></h3>
          {validatedVolunteers.length > 0 && (
            <button type="button" onClick={exportValidatedVolunteersPdf} className="pd-btn pd-btn--ghost pd-btn--sm">
              📄 Télécharger en PDF (A4 paysage)
            </button>
          )}
        </div>
        {validatedVolunteers.length === 0 ? (
          <p className="pd-muted">Aucun volontaire n'a encore validé sa mission sur ce programme.</p>
        ) : (
          <div className="pd-acc-list">
            {rankedValidatedVolunteers.map((v, i) => {
              const isOpen = openVolunteers.has(v.volunteerId);
              return (
                <div key={v.volunteerId} className={`pd-acc ${isOpen ? "pd-acc--open" : ""}`}>
                  <button type="button" onClick={() => toggleVolunteer(v.volunteerId)} className="pd-acc__header">
                    <span className="pd-acc__name">
                      <span className="pd-acc__rank">#{i + 1}</span> {v.prenom} {v.nom}{" "}
                      <span className="pd-muted">— {v.progress.percent}% ({v.approvedTasks.length} tâche(s) approuvée(s))</span>
                    </span>
                    <span className="pd-acc__right">
                      <ReportVolunteerButton programId={selectedProgramId} volunteerId={v.volunteerId} />
                      <span className="pd-chevron pd-acc__chevron">▾</span>
                    </span>
                  </button>
                  <div className="pd-acc__panel">
                    <div className="pd-acc__panel-inner">
                      {v.approvedTasks.map((t, i) => (
                        <div key={i} className="pd-task">
                          <strong>{t.taskTitle}</strong>
                          {t.occurrenceDate && (
                            <span className="pd-task__date">({new Date(t.occurrenceDate).toLocaleDateString("fr-FR")})</span>
                          )}
                          <dl className="pd-task__fields">
                            {(t.proofFields || []).map((f) => {
                              const value = t.responses?.[f.id];
                              if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
                              return (
                                <div key={f.id} className="pd-task__field">
                                  <dt>{f.label} : </dt>
                                  <dd>
                                    {f.type === "URL" ? (
                                      <a href={value} target="_blank" rel="noreferrer">{value}</a>
                                    ) : f.type === "IMAGE" ? (
                                      <span className="pd-task__thumbs">
                                        {value.map((url, idx) => (
                                          <a key={idx} href={url} target="_blank" rel="noreferrer">
                                            <img src={url} alt="" />
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Échanges */}
      <section className="pd-card pd-fade" style={{ "--pd-delay": "340ms" }}>
        <h3 className="pd-card__title">Vos échanges avec l'équipe AMP BENIN</h3>
        {myComments.length > 0 && (
          <div className="pd-thread">
            {myComments.map((c) => (
              <div key={c._id} className="pd-bubble">
                <div className="pd-bubble__date">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</div>
                <p className="pd-bubble__text">{c.text}</p>
                {c.reply ? (
                  <div className="pd-bubble__reply">
                    <strong>Réponse de l'équipe</strong>
                    {c.repliedAt && <span className="pd-bubble__reply-date">({new Date(c.repliedAt).toLocaleDateString("fr-FR")})</span>}
                    <p>{c.reply}</p>
                  </div>
                ) : (
                  <p className="pd-bubble__pending">En attente de réponse</p>
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
          className="pd-textarea"
        />
        <button type="button" onClick={submitComment} disabled={submittingComment || !comment.trim()} className="pd-btn pd-btn--primary pd-comment__cta">
          {submittingComment ? "Envoi..." : "Envoyer"}
        </button>
      </section>

      {/* Barre des partenaires — propre à CE programme (program.partnersBarImageUrl,
          pas un réglage global), tout en bas de CET espace uniquement (pas
          du site public). Change automatiquement si le partenaire bascule
          sur un autre programme suivi. Absente tant qu'aucune image n'est
          définie côté ADMIN pour ce programme. */}
      {program.partnersBarImageUrl && (
        <div className="pd-partners-bar pd-fade" style={{ "--pd-delay": "380ms" }}>
          <img src={program.partnersBarImageUrl} alt="Nos partenaires" />
        </div>
      )}

      <style>{PD_STYLES}</style>
    </div>
  );
}

const PD_STYLES = `
  .pd { display: flex; flex-direction: column; gap: 22px; font-family: var(--font-body, sans-serif); color: var(--col-text, #1A1A1A); }

  /* ── États (chargement / erreur / vide) ── */
  .pd-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    padding: 64px 24px; color: var(--col-text-muted, #7A7A7A); text-align: center;
  }
  .pd-state--error { color: var(--col-error, #C1121F); }
  .pd-state__icon { font-size: 2rem; }
  .pd-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--col-primary-bg, #E8F5EF); border-top-color: var(--col-primary, #1B4332);
    animation: pd-spin 800ms linear infinite;
  }
  @keyframes pd-spin { to { transform: rotate(360deg); } }

  .pd-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
  .pd-muted { color: var(--col-text-muted, #7A7A7A); }
  .pd-count { color: var(--col-text-muted, #7A7A7A); font-weight: 400; font-size: 0.85em; }

  /* ── Animations d'entrée ── */
  @keyframes pd-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .pd-fade { opacity: 0; animation: pd-fade-up 560ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: var(--pd-delay, 0ms); }

  /* ── Hero co-brandé ── */
  .pd-hero {
    position: relative; overflow: hidden; border-radius: 24px; padding: 28px 32px;
    background: linear-gradient(135deg, var(--col-primary-dark, #0F2A1E) 0%, var(--col-primary, #1B4332) 60%, var(--col-primary-light, #2D6A4F) 100%);
    color: #fff; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;
    box-shadow: var(--sh-lg, 0 8px 40px rgba(27,67,50,0.16));
    animation: pd-fade-up 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .pd-hero__glow {
    position: absolute; top: -80px; right: -60px; width: 260px; height: 260px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,144,58,0.35) 0%, rgba(201,144,58,0) 70%);
    pointer-events: none; animation: pd-glow 5s ease-in-out infinite alternate;
  }
  @keyframes pd-glow { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.15); opacity: 1; } }
  .pd-hero__content { display: flex; align-items: center; gap: 16px; z-index: 1; }
  .pd-hero__logos { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .pd-hero__logos .pd-hero__x { font-size: 1.1rem; font-weight: 700; }
  .pd-hero__logo {
    height: 56px; width: 56px; border-radius: 14px; flex-shrink: 0;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  }
  .pd-hero__logo--img { object-fit: cover; border: 2px solid rgba(255,255,255,0.35); }
  .pd-hero__logo--fallback {
    background: rgba(255,255,255,0.14); border: 2px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;
  }
  .pd-hero__tag {
    display: inline-block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em;
    background: rgba(201,144,58,0.25); color: var(--col-accent-light, #E8C47A);
    padding: 3px 10px; border-radius: 999px; font-weight: 700; margin-bottom: 6px;
  }
  .pd-hero__title {
    font-family: var(--font-heading, serif); font-size: 1.5rem; font-weight: 600; margin: 0 0 6px;
    line-height: 1.25;
  }
  .pd-hero__x { color: var(--col-accent-light, #E8C47A); }
  .pd-hero__logo-link {
    font-size: 0.78rem; color: rgba(255,255,255,0.75); cursor: pointer; text-decoration: underline;
    text-underline-offset: 3px; transition: color 150ms ease;
  }
  .pd-hero__logo-link:hover { color: #fff; }
  .pd-hero__picker {
    z-index: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 14px; padding: 10px 16px; backdrop-filter: blur(6px);
  }
  .pd-hero__picker-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.65); margin-bottom: 4px; }
  .pd-select--hero {
    background: rgba(255,255,255,0.95); color: var(--col-primary-dark, #0F2A1E); border: none;
    border-radius: 8px; padding: 7px 10px; font-weight: 600; min-width: 220px;
  }

  /* ── Phrase d'impact ── */
  .pd-impact {
    display: flex; align-items: flex-start; gap: 10px; padding: 18px 24px;
    background: var(--col-accent-bg, #FDF4E7); border-left: 4px solid var(--col-accent, #C9903A);
    border-radius: 14px; font-family: var(--font-heading, serif); font-size: 1.1rem; color: var(--col-primary-dark, #0F2A1E);
  }
  .pd-impact__mark { font-size: 2rem; line-height: 1; color: var(--col-accent, #C9903A); font-family: var(--font-heading, serif); }
  .pd-impact p { margin: 4px 0 0; }

  /* ── Cartes génériques ── */
  .pd-card {
    background: #fff; border: 1px solid var(--col-border-light, #EEEAE3); border-radius: 18px;
    padding: 24px 28px; box-shadow: var(--sh-xs, 0 1px 3px rgba(27,67,50,0.06));
    transition: box-shadow 250ms ease;
  }
  .pd-card:hover { box-shadow: var(--sh-sm, 0 2px 8px rgba(27,67,50,0.09)); }
  .pd-card__title {
    font-family: var(--font-heading, serif); color: var(--col-primary-dark, #0F2A1E); font-size: 1.1rem;
    margin: 0 0 16px; font-weight: 600;
  }
  .pd-card__heading { font-family: var(--font-heading, serif); color: var(--col-primary-dark, #0F2A1E); margin: 0 0 4px; }

  /* ── Chiffres clés ── */
  .pd-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
  .pd-stat {
    position: relative; background: var(--col-primary-bg, #E8F5EF); border-radius: 14px; padding: 18px;
    text-align: center; overflow: hidden;
    opacity: 0; animation: pd-fade-up 500ms cubic-bezier(0.25,0.46,0.45,0.94) forwards;
    animation-delay: var(--pd-stat-delay, 0ms);
    transition: transform 220ms ease, box-shadow 220ms ease;
  }
  .pd-stat::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--col-primary, #1B4332), var(--col-accent, #C9903A));
  }
  .pd-stat:hover { transform: translateY(-3px); box-shadow: var(--sh-sm, 0 2px 8px rgba(27,67,50,0.09)); }
  .pd-stat__icon { font-size: 1.4rem; display: block; margin-bottom: 6px; }
  .pd-stat__value { font-family: var(--font-heading, serif); font-size: 1.9rem; font-weight: 700; color: var(--col-primary, #1B4332); }
  .pd-stat__label { font-size: 0.78rem; color: var(--col-text-sec, #4A4A4A); margin-top: 4px; }

  /* ── Galerie ── */
  .pd-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .pd-gallery__item {
    position: relative; display: block; border-radius: 12px; overflow: hidden; aspect-ratio: 1 / 1;
    opacity: 0; animation: pd-fade-up 450ms ease forwards; animation-delay: var(--pd-stat-delay, 0ms);
    box-shadow: var(--sh-xs, 0 1px 3px rgba(27,67,50,0.06));
  }
  .pd-gallery__item img { width: 100%; height: 100%; object-fit: cover; transition: transform 400ms cubic-bezier(0.25,0.46,0.45,0.94); display: block; }
  .pd-gallery__item:hover img { transform: scale(1.12); }
  .pd-gallery__caption {
    position: absolute; inset: auto 0 0 0; padding: 8px 10px 6px; font-size: 0.7rem; color: #fff;
    background: linear-gradient(0deg, rgba(15,42,30,0.85), rgba(15,42,30,0));
    opacity: 0; transform: translateY(6px); transition: opacity 220ms ease, transform 220ms ease;
  }
  .pd-gallery__item:hover .pd-gallery__caption { opacity: 1; transform: translateY(0); }

  /* ── Barre d'outils / filtres ── */
  .pd-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: flex-start; }
  .pd-toolbar__search { flex: 1 1 240px; }
  .pd-filters { position: relative; }
  .pd-filters__panel {
    position: absolute; right: 0; z-index: 10; margin-top: 6px; width: 280px; background: #fff;
    border: 1px solid var(--col-border-light, #EEEAE3); border-radius: 14px; box-shadow: var(--sh-lg, 0 8px 40px rgba(27,67,50,0.16));
    padding: 18px; display: flex; flex-direction: column; gap: 14px;
    animation: pd-fade-up 180ms ease;
  }
  .pd-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .pd-field label { font-size: 0.72rem; color: var(--col-text-muted, #7A7A7A); text-transform: uppercase; letter-spacing: 0.04em; }
  .pd-field-row { display: flex; gap: 10px; }

  /* ── Champs de formulaire ── */
  .pd-input, .pd-select, .pd-textarea {
    width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--col-border, #DDD8CE);
    border-radius: 10px; font-family: inherit; font-size: 0.88rem; color: var(--col-text, #1A1A1A);
    background: #fff; transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .pd-input:focus, .pd-select:focus, .pd-textarea:focus {
    outline: none; border-color: var(--col-primary-light, #2D6A4F); box-shadow: 0 0 0 3px var(--col-primary-bg, #E8F5EF);
  }
  .pd-textarea { resize: vertical; }

  /* ── Boutons ── */
  .pd-btn {
    display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 10px;
    padding: 9px 18px; font-weight: 700; font-size: 0.85rem; cursor: pointer; white-space: nowrap;
    transition: background 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    font-family: inherit;
  }
  .pd-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .pd-btn--primary { background: var(--col-primary, #1B4332); color: #fff; }
  .pd-btn--primary:hover:not(:disabled) { background: var(--col-primary-light, #2D6A4F); transform: translateY(-1px); box-shadow: var(--sh-sm, 0 2px 8px rgba(27,67,50,0.09)); }
  .pd-btn--accent { background: var(--col-accent, #C9903A); color: #fff; }
  .pd-btn--accent:hover:not(:disabled) { background: var(--col-accent-dark, #A87028); transform: translateY(-1px); box-shadow: var(--sh-accent, 0 4px 24px rgba(201,144,58,0.28)); }
  .pd-btn--ghost { background: #fff; color: var(--col-text-sec, #4A4A4A); border: 1px solid var(--col-border, #DDD8CE); }
  .pd-btn--ghost:hover:not(:disabled) { background: var(--col-surface, #F5F0E8); border-color: var(--col-primary-light, #2D6A4F); color: var(--col-primary-dark, #0F2A1E); }
  .pd-btn--filter { background: #fff; color: var(--col-text-sec, #4A4A4A); border: 1px solid var(--col-border, #DDD8CE); }
  .pd-btn--filter.is-active { border-color: var(--col-accent, #C9903A); background: var(--col-accent-bg, #FDF4E7); color: var(--col-accent-xdark, #7A5018); }
  .pd-btn--filter:hover { border-color: var(--col-accent, #C9903A); }
  .pd-btn--linklike { background: none; color: var(--col-error, #C1121F); font-size: 0.78rem; text-align: left; padding: 0; }
  .pd-btn--linklike:hover { text-decoration: underline; }
  .pd-btn--sm { padding: 6px 14px; font-size: 0.78rem; }
  .pd-chevron { display: inline-block; transition: transform 200ms ease; font-size: 0.7rem; }
  .pd-chevron.is-open { transform: rotate(180deg); }

  /* ── En-tête de carte avec bouton d'export (ex: Volontaires validés) ── */
  .pd-card__header-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .pd-card__header-row .pd-card__title { margin: 0; }
  .pd-acc__rank { display: inline-block; font-size: 0.75rem; font-weight: 800; color: var(--col-accent-dark, #A87028); margin-right: 2px; }

  /* ── Badges ── */
  .pd-badge {
    display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: 0.74rem; font-weight: 700;
  }
  .pd-badge--success { background: var(--col-success-bg, #D8F3E3); color: var(--col-success, #40916C); }
  .pd-badge--warning { background: var(--col-accent-bg, #FDF4E7); color: var(--col-accent-dark, #A87028); }
  .pd-badge--accent { background: var(--col-accent, #C9903A); color: #fff; font-size: 0.65rem; padding: 1px 7px; margin-left: 4px; }

  /* ── Tableau ── */
  .pd-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--col-border-light, #EEEAE3); }
  .pd-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
  .pd-table thead th {
    text-align: left; padding: 11px 14px; background: var(--col-surface, #F5F0E8); color: var(--col-text-sec, #4A4A4A);
    font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em;
    border-bottom: 2px solid var(--col-border, #DDD8CE);
  }
  .pd-table tbody td { padding: 11px 14px; border-bottom: 1px solid var(--col-border-light, #EEEAE3); vertical-align: middle; }
  .pd-table tbody tr { transition: background 150ms ease; }
  .pd-table tbody tr:hover { background: var(--col-primary-bg, #E8F5EF); }
  .pd-table tbody tr:last-child td { border-bottom: none; }
  .pd-row--flagged { background: var(--col-error-bg, #FFE8EA); box-shadow: inset 3px 0 0 var(--col-error, #C1121F); }
  .pd-row--flagged:hover { background: #ffdadd; }

  .pd-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 0.85rem; }
  .pd-pagination__info { color: var(--col-text-muted, #7A7A7A); }

  /* ── Graphique ── */
  .pd-chart { height: 240px; }

  /* ── Programme / rapport ── */
  .pd-program__desc { margin: 0 0 4px; }
  .pd-program__meta { font-size: 0.85rem; color: var(--col-text-muted, #7A7A7A); margin: 0 0 14px; }
  .pd-downloads { display: flex; flex-direction: column; gap: 10px; }
  .pd-checkbox {
    display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem;
    color: var(--col-text-sec, #4A4A4A); cursor: pointer; width: fit-content;
  }
  .pd-checkbox input { width: 16px; height: 16px; accent-color: var(--col-primary, #1B4332); cursor: pointer; }
  .pd-downloads__buttons { display: flex; flex-wrap: wrap; gap: 10px; }

  /* ── Accordéon volontaires ── */
  .pd-acc-list { display: flex; flex-direction: column; gap: 10px; }
  .pd-acc { border: 1px solid var(--col-border-light, #EEEAE3); border-radius: 14px; overflow: hidden; transition: border-color 200ms ease, box-shadow 200ms ease; }
  .pd-acc--open { border-color: var(--col-primary-light, #2D6A4F); box-shadow: var(--sh-xs, 0 1px 3px rgba(27,67,50,0.06)); }
  .pd-acc__header {
    width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
    background: #fff; border: none; padding: 14px 18px; cursor: pointer; text-align: left; font-family: inherit;
    transition: background 150ms ease;
  }
  .pd-acc__header:hover { background: var(--col-surface, #F5F0E8); }
  .pd-acc__name { font-weight: 700; color: var(--col-text, #1A1A1A); font-size: 0.92rem; }
  .pd-acc__right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .pd-acc__chevron { color: var(--col-primary, #1B4332); font-size: 0.85rem; }
  .pd-acc__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 320ms cubic-bezier(0.25,0.46,0.45,0.94); }
  .pd-acc--open .pd-acc__panel { grid-template-rows: 1fr; }
  .pd-acc__panel-inner { overflow: hidden; }
  .pd-task { padding: 12px 18px; border-top: 1px solid var(--col-border-light, #EEEAE3); font-size: 0.88rem; }
  .pd-task__date { font-size: 0.72rem; color: var(--col-text-muted, #7A7A7A); margin-left: 8px; }
  .pd-task__fields { margin: 6px 0 0; }
  .pd-task__field dt { display: inline; font-weight: 600; }
  .pd-task__field dd { display: inline; margin: 0; }
  .pd-task__thumbs { display: inline-flex; gap: 6px; flex-wrap: wrap; }
  .pd-task__thumbs img { height: 52px; width: 52px; object-fit: cover; border-radius: 8px; transition: transform 200ms ease; }
  .pd-task__thumbs img:hover { transform: scale(1.08); }

  /* ── Échanges ── */
  .pd-thread { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
  .pd-bubble {
    border: 1px solid var(--col-border-light, #EEEAE3); border-radius: 14px; padding: 14px 16px;
    background: var(--col-bg, #FAFAF8);
  }
  .pd-bubble__date { font-size: 0.72rem; color: var(--col-text-muted, #7A7A7A); margin-bottom: 5px; }
  .pd-bubble__text { margin: 0 0 8px; white-space: pre-line; }
  .pd-bubble__reply { background: var(--col-primary-bg, #E8F5EF); border-radius: 10px; padding: 10px 12px; font-size: 0.88rem; }
  .pd-bubble__reply strong { color: var(--col-primary-dark, #0F2A1E); }
  .pd-bubble__reply-date { font-size: 0.68rem; color: var(--col-text-muted, #7A7A7A); margin-left: 6px; }
  .pd-bubble__reply p { margin: 4px 0 0; white-space: pre-line; }
  .pd-bubble__pending { margin: 0; font-size: 0.78rem; color: var(--col-text-muted, #7A7A7A); font-style: italic; }
  .pd-comment__cta { margin-top: 10px; }

  /* ── Barre des partenaires (tout en bas de CET espace) ── */
  .pd-partners-bar {
    border-radius: 18px; overflow: hidden; border: 1px solid var(--col-border-light, #EEEAE3);
    box-shadow: var(--sh-xs, 0 1px 3px rgba(27,67,50,0.06));
  }
  .pd-partners-bar img { display: block; width: 100%; height: auto; }

  /* ── Responsive ── */
  @media (max-width: 720px) {
    .pd-hero { padding: 22px; flex-direction: column; align-items: flex-start; }
    .pd-card { padding: 18px 16px; }
    .pd-toolbar { flex-direction: column; align-items: stretch; }
    .pd-filters__panel { position: static; width: 100%; margin-top: 10px; }
  }
`;
