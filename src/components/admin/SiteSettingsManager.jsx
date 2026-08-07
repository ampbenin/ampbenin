// src/components/admin/SiteSettingsManager.jsx
// Réglages globaux du site (nouveau, 2026-08-07) : logo AMP BENIN et
// bannière "Barre des partenaires" — UNE seule image composée par l'ADMIN
// (pas générée automatiquement à partir des logos de chaque partenaire),
// affichée en pleine largeur tout en bas du site public (voir Footer.astro).
// GET public (aucun token nécessaire), PATCH réservé ADMIN — voir
// controllers/siteSettingsController.js.
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

function ImageUploadCard({ title, hint, currentUrl, onUpload, uploading }) {
  return (
    <div className="ssm-card">
      <h3 className="ssm-card__title">{title}</h3>
      <p className="ssm-card__hint">{hint}</p>
      <div className="ssm-card__preview">
        {currentUrl ? (
          <img src={currentUrl} alt={title} />
        ) : (
          <span className="ssm-card__empty">Aucune image définie</span>
        )}
      </div>
      <label className="ssm-card__upload">
        {uploading ? "Envoi en cours..." : currentUrl ? "Remplacer l'image" : "Envoyer une image"}
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="ssm-sr-only" />
      </label>
    </div>
  );
}

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingField, setUploadingField] = useState(null); // "ampLogo" | "partnersBar" | null

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

  const upload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const form = new FormData();
      form.append(field, file);
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
      setUploadingField(null);
      e.target.value = "";
    }
  };

  if (loading) return <p className="ssm-muted">Chargement...</p>;
  if (error) return <p className="ssm-error">{error}</p>;

  return (
    <div className="ssm">
      <p className="ssm-intro">
        Ces deux images sont utilisées uniquement dans l'espace partenaire : le logo AMP BENIN apparaît à
        côté du logo de chaque partenaire dans son tableau de bord et sur chaque page des rapports PDF
        téléchargés ; la barre des partenaires s'affiche en pleine largeur tout en bas de ce même espace.
      </p>
      <div className="ssm-grid">
        <ImageUploadCard
          title="Logo AMP BENIN"
          hint="Affiché à côté du logo du partenaire dans son espace, et en en-tête de chaque page des rapports PDF."
          currentUrl={settings?.ampLogoUrl}
          onUpload={(e) => upload("ampLogo", e)}
          uploading={uploadingField === "ampLogo"}
        />
        <ImageUploadCard
          title="Barre des partenaires"
          hint="Une seule image (bannière/collage déjà composé), affichée en pleine largeur tout en bas de l'espace partenaire — et en pied de page de chaque page des rapports PDF."
          currentUrl={settings?.partnersBarImageUrl}
          onUpload={(e) => upload("partnersBar", e)}
          uploading={uploadingField === "partnersBar"}
        />
      </div>

      <style>{`
        .ssm { max-width: 760px; }
        .ssm-intro { color: var(--col-text-muted, #7A7A7A); font-size: 0.9rem; margin: 0 0 24px; line-height: 1.6; }
        .ssm-muted { color: var(--col-text-muted, #7A7A7A); }
        .ssm-error { color: var(--col-error, #C1121F); }
        .ssm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
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
      `}</style>
    </div>
  );
}
