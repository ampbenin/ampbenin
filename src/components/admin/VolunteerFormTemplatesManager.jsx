// src/components/admin/VolunteerFormTemplatesManager.jsx
// Bibliothèque de modèles de formulaire réutilisables entre programmes de
// volontariat (mirror du panneau équivalent NumSAL). Un modèle se crée
// depuis le formulaire d'un programme (bouton "Enregistrer ce formulaire
// comme modèle" dans VolunteerProgramEditor) — ce panneau liste, marque le
// modèle par défaut des candidatures spontanées, et supprime.
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

export default function VolunteerFormTemplatesManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await adminFetch("/api/volunteer-form-templates");
      setTemplates(data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const setSpontaneousDefault = async (id) => {
    try {
      await adminFetch(`/api/volunteer-form-templates/${id}/set-spontaneous-default`, { method: "PATCH" });
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm("Supprimer ce modèle de formulaire ?")) return;
    try {
      await adminFetch(`/api/volunteer-form-templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-1">Modèles de formulaire</h2>
      <p className="text-sm text-gray-500 mb-4">
        Un modèle s'enregistre depuis le formulaire de candidature d'un programme, puis peut être importé
        dans n'importe quel autre programme. Le modèle marqué "candidature spontanée" est celui utilisé
        quand un volontaire postule sans choisir de programme précis.
      </p>
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">Aucun modèle enregistré pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t._id} className="flex items-center justify-between border-b py-2">
              <div>
                <strong>{t.name}</strong>
                <span className="text-sm text-gray-500 ml-2">{t.fields.length} champ{t.fields.length > 1 ? "s" : ""}</span>
                {t.isSpontaneousDefault && (
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    Candidature spontanée
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {!t.isSpontaneousDefault && (
                  <button onClick={() => setSpontaneousDefault(t._id)} className="text-blue-600 hover:underline text-sm">
                    Utiliser pour la candidature spontanée
                  </button>
                )}
                <button onClick={() => deleteTemplate(t._id)} className="text-red-600 hover:underline text-sm">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
