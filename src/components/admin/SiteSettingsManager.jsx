// src/components/admin/SiteSettingsManager.jsx
// Réglages globaux du site (nouveau, 2026-08-07) : logo AMP BENIN — un
// seul logo pour tout le monde, affiché à côté du logo de chaque
// partenaire dans son espace et sur chaque page des rapports PDF. GET
// public (aucun token nécessaire), PATCH réservé ADMIN — voir
// controllers/siteSettingsController.js.
//
// La bannière "Barre des partenaires" N'EST PAS ici : elle a d'abord été
// placée comme réglage global (comme le logo), mais l'utilisateur a
// précisé qu'elle doit être propre à CHAQUE PROGRAMME ("seuls les
// partenaires où ce programme a été affecté verront ça") — elle se gère
// donc désormais programme par programme, dans l'onglet "Partenaires" de
// VolunteerProgramEditor.jsx (voir VolunteerProgram.partnersBarImageUrl).
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const res = await adminFetch("/api/site-settings");
      setSettings(res);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("ampLogo", file);
      const token = localStorage.getItem("amp_token");
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Erreur lors de l'envoi de l'image");
      setSettings(body);
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi de l'image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) return <p className="ssm-muted">Chargement...</p>;
  if (error) return <p className="ssm-error">{error}</p>;

  return (
    <div className="ssm">
      <p className="ssm-intro">
        Ce logo est utilisé uniquement dans l'espace partenaire : il apparaît à côté du logo de chaque
        partenaire dans son tableau de bord, et sur chaque page des rapports PDF téléchargés.
      </p>
      <div className="ssm-card">
        <h3 className="ssm-card__title">Logo AMP BENIN</h3>
        <p className="ssm-card__hint">Affiché à côté du logo du partenaire dans son espace, et en en-tête de chaque page des rapports PDF.</p>
        <div className="ssm-card__preview">
          {settings?.ampLogoUrl ? (
            <img src={settings.ampLogoUrl} alt="Logo AMP BENIN" />
          ) : (
            <span className="ssm-card__empty">Aucune image définie</span>
          )}
        </div>
        <label className="ssm-card__upload">
          {uploading ? "Envoi en cours..." : settings?.ampLogoUrl ? "Remplacer l'image" : "Envoyer une image"}
          <input type="file" accept="image/*" onChange={upload} disabled={uploading} className="ssm-sr-only" />
        </label>
      </div>

      <p className="ssm-note">
        La bannière "Barre des partenaires" ne se règle plus ici — elle est propre à chaque programme de
        volontariat (seuls les partenaires suivant ce programme la voient). Elle se gère depuis l'onglet
        "Partenaires" de chaque programme, dans <strong>Volontaires &amp; Missions → Programmes de volontariat</strong>.
      </p>

      <style>{`
        .ssm { max-width: 520px; }
        .ssm-intro { color: var(--col-text-muted, #7A7A7A); font-size: 0.9rem; margin: 0 0 24px; line-height: 1.6; }
        .ssm-muted { color: var(--col-text-muted, #7A7A7A); }
        .ssm-error { color: var(--col-error, #C1121F); }
        .ssm-card {
          background: #fff; border: 1px solid var(--col-border-light, #EEEAE3); border-radius: 14px;
          padding: 20px; display: flex; flex-direction: column; gap: 10px;
        }
        .ssm-card__title { margin: 0; font-family: var(--font-heading, serif); color: var(--col-primary-dark, #0F2A1E); font-size: 1.05rem; }
        .ssm-card__hint { margin: 0; font-size: 0.8rem; color: var(--col-text-muted, #7A7A7A); line-height: 1.5; }
        .ssm-card__preview {
          background: var(--col-surface, #F5F0E8); border: 1px dashed var(--col-border, #DDD8CE); border-radius: 10px;
          min-height: 100px; display: flex; align-items: center; justify-content: center; padding: 10px;
        }
        .ssm-card__preview img { max-width: 100%; max-height: 140px; object-fit: contain; }
        .ssm-card__empty { color: var(--col-text-muted, #7A7A7A); font-size: 0.8rem; }
        .ssm-card__upload {
          align-self: flex-start; background: var(--col-primary, #1B4332); color: #fff; border-radius: 8px;
          padding: 8px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 150ms ease;
        }
        .ssm-card__upload:hover { background: var(--col-primary-light, #2D6A4F); }
        .ssm-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
        .ssm-note {
          margin-top: 20px; font-size: 0.82rem; color: var(--col-text-muted, #7A7A7A); line-height: 1.6;
          background: var(--col-accent-bg, #FDF4E7); border-left: 3px solid var(--col-accent, #C9903A);
          border-radius: 8px; padding: 12px 14px;
        }
      `}</style>
    </div>
  );
}
