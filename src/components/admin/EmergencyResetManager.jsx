// src/components/admin/EmergencyResetManager.jsx
// Espace ADMIN (uniquement) — mesure temporaire de réinitialisation
// d'urgence pour les volontaires dont le lien de définition de mot de
// passe a expiré avant utilisation (voir
// controllers/emergencyResetController.js).
//
// Un ADMIN choisit une cible (comptes précis ou tout un programme), un
// champ de contrôle (nom/prénom/téléphone/âge — comparé à la fiche de
// chaque volontaire) et une durée d'expiration, puis génère UN lien
// public partagé. Pas d'email automatique (décision utilisateur) :
// l'ADMIN copie le lien affiché ici et le communique lui-même.
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const FIELD_LABELS = { nom: "Nom", prenom: "Prénom", telephone: "Téléphone", age: "Âge" };
const EXPIRY_OPTIONS = [
  { hours: 24, label: "24 heures" },
  { hours: 48, label: "48 heures" },
  { hours: 72, label: "72 heures" },
  { hours: 168, label: "7 jours" },
];

function hasFieldData(volunteer, field) {
  switch (field) {
    case "nom": return !!volunteer.nom;
    case "prenom": return !!volunteer.prenom;
    case "telephone": return !!(volunteer.telephone && String(volunteer.telephone).trim());
    case "age": return !!volunteer.dateNaissance;
    default: return false;
  }
}

export default function EmergencyResetManager() {
  const [volunteers, setVolunteers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetType, setTargetType] = useState("VOLUNTEERS");
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState(new Set());
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [validationField, setValidationField] = useState("telephone");
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState(null); // { url, targetCount, missingDataCount }

  const load = async () => {
    try {
      const [volRes, progRes, batchRes] = await Promise.all([
        adminFetch("/api/volunteers"),
        adminFetch("/api/volunteer-programs/all"),
        adminFetch("/api/emergency-reset/batches"),
      ]);
      setVolunteers(volRes?.items || volRes || []);
      setPrograms(progRes?.items || []);
      setBatches(batchRes?.items || []);
    } catch (err) {
      console.error("Erreur chargement réinitialisation d'urgence", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredVolunteers = useMemo(() => {
    const q = volunteerSearch.trim().toLowerCase();
    if (!q) return volunteers;
    return volunteers.filter((v) =>
      `${v.nom} ${v.prenom} ${v.email}`.toLowerCase().includes(q)
    );
  }, [volunteers, volunteerSearch]);

  const toggleVolunteer = (id) => {
    setSelectedVolunteerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Avertissement affiché AVANT même de soumettre — le serveur revérifie
  // de toute façon (missingDataCount dans la réponse), mais un retour
  // immédiat évite un aller-retour inutile pour un cas fréquent (ex. Âge
  // choisi alors que personne n'a de date de naissance renseignée).
  const previewMissingCount = useMemo(() => {
    let target = [];
    if (targetType === "VOLUNTEERS") {
      target = volunteers.filter((v) => selectedVolunteerIds.has(v._id));
    } else if (selectedProgramId) {
      target = volunteers.filter((v) => (v.programs || []).some((p) => String(p.programId) === selectedProgramId));
    }
    return { total: target.length, missing: target.filter((v) => !hasFieldData(v, validationField)).length };
  }, [targetType, selectedVolunteerIds, selectedProgramId, volunteers, validationField]);

  const createBatch = async () => {
    if (targetType === "VOLUNTEERS" && selectedVolunteerIds.size === 0) {
      alert("Sélectionnez au moins un volontaire.");
      return;
    }
    if (targetType === "PROGRAM" && !selectedProgramId) {
      alert("Choisissez un programme.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        targetType,
        validationField,
        expiresInHours,
        ...(targetType === "VOLUNTEERS"
          ? { volunteerIds: [...selectedVolunteerIds] }
          : { programId: selectedProgramId }),
      };
      const res = await adminFetch("/api/emergency-reset/batches", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const url = `${window.location.origin}/mon-espace/urgence/${res.batch.token}`;
      setLastCreated({ url, targetCount: res.targetCount, missingDataCount: res.missingDataCount, expiresAt: res.batch.expiresAt });
      setSelectedVolunteerIds(new Set());
      setSelectedProgramId("");
      load();
    } catch (err) {
      alert(err.message || "Erreur lors de la création du lien d'urgence");
    } finally {
      setSubmitting(false);
    }
  };

  const deactivateBatch = async (id) => {
    if (!confirm("Désactiver ce lien d'urgence maintenant ? Il ne fonctionnera plus pour personne.")) return;
    try {
      await adminFetch(`/api/emergency-reset/batches/${id}/deactivate`, { method: "PATCH" });
      load();
    } catch (err) {
      alert(err.message || "Erreur lors de la désactivation");
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard?.writeText(url);
    alert("Lien copié dans le presse-papiers.");
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Réinitialisation d'urgence</h2>
        <p className="text-sm text-gray-500 max-w-2xl">
          Mesure temporaire pour débloquer des volontaires dont le lien de définition de mot de passe a expiré.
          Génère UN lien public partagé — le volontaire s'identifie par email et répond à une question de contrôle
          (le champ choisi ci-dessous) comparée à sa propre fiche, avant de pouvoir définir un nouveau mot de passe.
          Aucun email n'est envoyé automatiquement : copiez le lien généré et communiquez-le vous-même (WhatsApp, oral, affichage...).
        </p>
      </div>

      {/* Formulaire de création */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={targetType === "VOLUNTEERS"} onChange={() => setTargetType("VOLUNTEERS")} />
            Comptes spécifiques
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={targetType === "PROGRAM"} onChange={() => setTargetType("PROGRAM")} />
            Tout un programme
          </label>
        </div>

        {targetType === "VOLUNTEERS" ? (
          <div>
            <input
              type="text"
              placeholder="🔍 Rechercher un volontaire (nom, prénom, email)..."
              value={volunteerSearch}
              onChange={(e) => setVolunteerSearch(e.target.value)}
              className="border px-3 py-2 rounded w-full mb-2 text-sm"
            />
            <div className="border rounded max-h-48 overflow-y-auto">
              {filteredVolunteers.length === 0 ? (
                <p className="text-xs text-gray-400 p-3">Aucun volontaire trouvé.</p>
              ) : (
                filteredVolunteers.map((v) => (
                  <label key={v._id} className="flex items-center gap-2 px-3 py-1.5 text-sm border-b last:border-b-0 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedVolunteerIds.has(v._id)} onChange={() => toggleVolunteer(v._id)} />
                    <span>{v.nom} {v.prenom} <span className="text-gray-400">({v.email})</span></span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedVolunteerIds.size} sélectionné(s)</p>
          </div>
        ) : (
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className="border px-3 py-2 rounded w-full text-sm">
            <option value="">-- Choisir un programme --</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Question de contrôle</label>
            <select value={validationField} onChange={(e) => setValidationField(e.target.value)} className="border px-3 py-2 rounded w-full text-sm">
              {Object.entries(FIELD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Le lien expire après</label>
            <select value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))} className="border px-3 py-2 rounded w-full text-sm">
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {previewMissingCount.total > 0 && previewMissingCount.missing > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠️ {previewMissingCount.missing} sur {previewMissingCount.total} volontaire(s) sélectionné(s) n'ont pas de{" "}
            {FIELD_LABELS[validationField].toLowerCase()} renseigné — ils ne pourront pas valider avec ce critère.
          </p>
        )}

        <button
          onClick={createBatch}
          disabled={submitting}
          className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Génération..." : "🚨 Générer le lien d'urgence"}
        </button>
      </div>

      {lastCreated && (
        <div className="border border-green-300 bg-green-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-green-800">Lien généré — communiquez-le vous-même aux volontaires concernés :</p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="bg-white border rounded px-2 py-1 text-xs break-all">{lastCreated.url}</code>
            <button onClick={() => copyUrl(lastCreated.url)} className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800">
              Copier
            </button>
          </div>
          <p className="text-xs text-gray-600">
            {lastCreated.targetCount} volontaire(s) concerné(s) — expire le {new Date(lastCreated.expiresAt).toLocaleString("fr-FR")}
            {lastCreated.missingDataCount > 0 && (
              <span className="text-amber-600"> — {lastCreated.missingDataCount} d'entre eux n'ont pas la donnée requise.</span>
            )}
          </p>
        </div>
      )}

      {/* Historique des lots */}
      <div>
        <h3 className="font-semibold mb-3">Liens générés ({batches.length})</h3>
        {batches.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun lien d'urgence généré pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const expired = b.isExpired;
              const status = !b.active ? "Désactivé" : expired ? "Expiré" : "Actif";
              const statusClass = !b.active || expired ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700";
              return (
                <div key={b._id} className="border border-gray-200 rounded-lg p-3 text-sm flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${statusClass}`}>{status}</span>
                    <strong>{FIELD_LABELS[b.validationField]}</strong>
                    <span className="text-gray-500">
                      {" — "}
                      {b.targetType === "PROGRAM" ? `Programme : ${b.programTitle}` : `${b.targetCount} compte(s) spécifique(s)`}
                      {" — "}{b.usedCount}/{b.targetCount} utilisé(s)
                      {" — expire le "}{new Date(b.expiresAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => copyUrl(`${window.location.origin}/mon-espace/urgence/${b.token}`)} className="text-xs text-blue-600 hover:underline">
                      Copier le lien
                    </button>
                    {b.active && !expired && (
                      <button onClick={() => deactivateBatch(b._id)} className="text-xs text-red-600 hover:underline">
                        Désactiver
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
