import React, { useEffect, useRef, useState } from 'react';

// Composition 100% côté navigateur : la photo du visiteur n'est jamais
// envoyée au serveur. Le canvas reprend la taille réelle du gabarit pour
// que le PNG téléchargé soit net, quelle que soit la taille affichée.

const MAX_CANVAS_WIDTH = 1600;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = src;
  });
}

// Recadre la photo pour remplir la zone (équivalent object-fit: cover).
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Ajuste la taille de police pour que le nom tienne dans la zone.
function drawFittedName(ctx, text, x, y, w, h, color) {
  let size = Math.floor(h * 0.8);
  ctx.font = `700 ${size}px sans-serif`;
  while (size > 8 && ctx.measureText(text).width > w) {
    size -= 2;
    ctx.font = `700 ${size}px sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.fillStyle = color;
  ctx.strokeText(text, x + w / 2, y + h / 2);
  ctx.fillText(text, x + w / 2, y + h / 2);
}

export default function BadgeGenerator({ campaign }) {
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rendering, setRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    loadImage(campaign.templateUrl)
      .then(setTemplate)
      .catch(() => setLoadError('Le gabarit du badge n\'a pas pu être chargé.'));
  }, [campaign.templateUrl]);

  const render = async () => {
    if (!template || !photoFile || !name.trim()) return null;
    setRendering(true);
    try {
      const photoUrl = URL.createObjectURL(photoFile);
      const photo = await loadImage(photoUrl);
      URL.revokeObjectURL(photoUrl);

      const scale = Math.min(1, MAX_CANVAS_WIDTH / template.width);
      const W = Math.round(template.width * scale);
      const H = Math.round(template.height * scale);
      const canvas = canvasRef.current;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(template, 0, 0, W, H);

      const p = campaign.photoZone;
      drawCover(ctx, photo, (p.x / 100) * W, (p.y / 100) * H, (p.w / 100) * W, (p.h / 100) * H);

      const n = campaign.nameZone;
      drawFittedName(ctx, name.trim(), (n.x / 100) * W, (n.y / 100) * H, (n.w / 100) * W, (n.h / 100) * H, campaign.colors?.nameText || '#FFFFFF');

      return canvas;
    } catch (err) {
      setLoadError('Impossible de générer le badge avec cette photo. Essayez un autre fichier.');
      return null;
    } finally {
      setRendering(false);
    }
  };

  // Aperçu live à chaque changement de nom ou de photo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = await render();
      if (!canvas || cancelled) return;
      setPreviewUrl(canvas.toDataURL('image/png'));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, photoFile, template]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `badge-${campaign.slug}-${name.trim().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      {loadError && <p className="text-red-600 bg-red-50 rounded px-3 py-2">{loadError}</p>}

      <label className="block font-semibold text-gray-800">
        Votre photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          className="block mt-1"
        />
      </label>

      <label className="block font-semibold text-gray-800">
        Votre nom (affiché sur le badge)
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Prénom Nom"
          className="border px-3 py-2 rounded w-full mt-1"
        />
      </label>

      <div className="flex justify-center bg-gray-100 rounded-xl p-4 min-h-[200px] items-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Aperçu de votre badge" className="max-w-full h-auto rounded" />
        ) : (
          <p className="text-gray-500 text-sm">
            {rendering ? 'Génération…' : 'Votre badge apparaîtra ici.'}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!previewUrl}
        style={{ backgroundColor: campaign.colors?.accent || '#1B4332' }}
        className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
      >
        Télécharger mon badge (PNG)
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
