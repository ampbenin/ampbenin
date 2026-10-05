import React, { useEffect, useRef, useState } from 'react';

// Composition 100% côté navigateur : la photo du visiteur n'est jamais
// envoyée au serveur. Le canvas reprend la taille réelle du gabarit pour
// que le PNG téléchargé soit net, quelle que soit la taille affichée.

const MAX_CANVAS_WIDTH = 1600;
const PREVIEW_CROP_WIDTH = 260;

const FRAMES = [
  { id: 'none', label: 'Sans cadre' },
  { id: 'or', label: 'Or' },
  { id: 'argent', label: 'Argent' },
  { id: 'double', label: 'Double filet' },
  { id: 'ombre', label: 'Passe-partout' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = src;
  });
}

// Découpe de la photo source pour remplir une zone de ratio `ratio` (w/h),
// avec zoom (>=1) et décalage (panX/panY dans [-1, 1]).
function cropRect(img, ratio, zoom, panX, panY) {
  const sh = Math.min(img.height, img.width / ratio) / zoom;
  const sw = sh * ratio;
  const maxX = (img.width - sw) / 2;
  const maxY = (img.height - sh) / 2;
  return {
    sx: img.width / 2 - sw / 2 + panX * maxX,
    sy: img.height / 2 - sh / 2 + panY * maxY,
    sw,
    sh,
  };
}

// Chemin de la forme (carré ou cercle inscrit) dans la zone photo.
function shapePath(ctx, shape, x, y, w, h) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  } else {
    ctx.rect(x, y, w, h);
  }
}

// Cadres décoratifs : or, argent, double filet, passe-partout.
function drawFrame(ctx, style, shape, x, y, w, h, accent) {
  if (style === 'none') return;
  const size = Math.min(w, h);
  const pad = size * 0.03;
  ctx.save();

  if (style === 'ombre') {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = size * 0.06;
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = '#ffffff';
    shapePath(ctx, shape, x, y, w, h);
    ctx.stroke();
    ctx.restore();
    return;
  }

  let stroke;
  if (style === 'or' || style === 'argent') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    if (style === 'or') {
      g.addColorStop(0, '#F7E08A');
      g.addColorStop(0.5, '#B8862B');
      g.addColorStop(1, '#F7E08A');
    } else {
      g.addColorStop(0, '#F4F7FA');
      g.addColorStop(0.5, '#8A94A0');
      g.addColorStop(1, '#F4F7FA');
    }
    stroke = g;
    ctx.lineWidth = size * 0.04;
    ctx.strokeStyle = stroke;
    shapePath(ctx, shape, x - pad, y - pad, w + pad * 2, h + pad * 2);
    ctx.stroke();
  } else if (style === 'double') {
    ctx.lineWidth = size * 0.012;
    ctx.strokeStyle = accent;
    shapePath(ctx, shape, x - pad * 2, y - pad * 2, w + pad * 4, h + pad * 4);
    ctx.stroke();
    ctx.strokeStyle = accent;
    shapePath(ctx, shape, x - pad * 0.5, y - pad * 0.5, w + pad, h + pad);
    ctx.stroke();
  }
  ctx.restore();
}

export default function BadgeGenerator({ campaign }) {
  const accent = campaign.colors?.accent || '#1B4332';
  const nameColor = campaign.colors?.nameText || '#FFFFFF';

  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photo, setPhoto] = useState(null);
  const [template, setTemplate] = useState(null);
  const [shape, setShape] = useState('square');
  const [frame, setFrame] = useState('none');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [rendering, setRendering] = useState(false);

  const cropCanvasRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const p = campaign.photoZone;
  const n = campaign.nameZone;

  useEffect(() => {
    loadImage(campaign.templateUrl)
      .then(setTemplate)
      .catch(() => setLoadError('Le gabarit du badge n\'a pas pu être chargé.'));
  }, [campaign.templateUrl]);

  // Zone photo en ratio réel (pixels du gabarit), pour que le recadrage
  // corresponde exactement à ce qui sera imprimé sur le badge.
  const zoneRatio = template ? (p.w * template.width) / (p.h * template.height) : 1;

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      setPhotoUrl(url);
      setPhoto(img);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setLoadError('');
    } catch {
      setLoadError('Cette image ne peut pas être utilisée. Essayez un autre fichier.');
    }
  };

  // Aperçu de recadrage : même découpe que le rendu final, en petit.
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !photo) return;
    const w = PREVIEW_CROP_WIDTH;
    const h = Math.round(w / zoneRatio);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, w, h);
    const c = cropRect(photo, zoneRatio, zoom, panX, panY);
    ctx.drawImage(photo, c.sx, c.sy, c.sw, c.sh, 0, 0, w, h);
  }, [photo, zoneRatio, zoom, panX, panY]);

  const onCropPointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, panX, panY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onCropPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Un glissé sur toute la largeur de l'aperçu = la plage complète de décalage.
    const nx = Math.max(-1, Math.min(1, d.panX - ((e.clientX - d.x) / rect.width) * 2));
    const ny = Math.max(-1, Math.min(1, d.panY - ((e.clientY - d.y) / rect.height) * 2));
    setPanX(nx);
    setPanY(ny);
  };

  const onCropPointerUp = () => {
    dragRef.current = null;
  };

  const renderBadge = () => {
    if (!template || !photo || !name.trim()) return null;
    const scale = Math.min(1, MAX_CANVAS_WIDTH / template.width);
    const W = Math.round(template.width * scale);
    const H = Math.round(template.height * scale);
    const canvas = canvasRef.current;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0, W, H);

    const zx = (p.x / 100) * W;
    const zy = (p.y / 100) * H;
    const zw = (p.w / 100) * W;
    const zh = (p.h / 100) * H;

    const c = cropRect(photo, zw / zh, zoom, panX, panY);
    ctx.save();
    shapePath(ctx, shape, zx, zy, zw, zh);
    ctx.clip();
    ctx.drawImage(photo, c.sx, c.sy, c.sw, c.sh, zx, zy, zw, zh);
    ctx.restore();

    drawFrame(ctx, frame, shape, zx, zy, zw, zh, accent);

    const nx = (n.x / 100) * W;
    const ny = (n.y / 100) * H;
    const nw = (n.w / 100) * W;
    const nh = (n.h / 100) * H;
    let size = Math.floor(nh * 0.8);
    ctx.font = `700 ${size}px sans-serif`;
    while (size > 8 && ctx.measureText(name.trim()).width > nw) {
      size -= 2;
      ctx.font = `700 ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size / 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.fillStyle = nameColor;
    ctx.strokeText(name.trim(), nx + nw / 2, ny + nh / 2);
    ctx.fillText(name.trim(), nx + nw / 2, ny + nh / 2);

    return canvas;
  };

  // Aperçu du badge complet, recalculé après une courte pause de saisie/glisser.
  useEffect(() => {
    if (!template || !photo || !name.trim()) {
      setPreviewUrl('');
      return;
    }
    setRendering(true);
    const t = setTimeout(() => {
      try {
        const canvas = renderBadge();
        if (canvas) setPreviewUrl(canvas.toDataURL('image/png'));
      } catch {
        setLoadError('Impossible de générer le badge avec cette photo. Essayez un autre fichier.');
      } finally {
        setRendering(false);
      }
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, photo, template, zoom, panX, panY, shape, frame]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `badge-${campaign.slug}-${name.trim().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const choiceBtn = (active) =>
    `px-3 py-2 rounded-lg border text-sm font-medium ${active ? 'text-white' : 'bg-white text-gray-700 border-gray-300'}`;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      {loadError && <p className="text-red-600 bg-red-50 rounded px-3 py-2">{loadError}</p>}

      <label className="block font-semibold text-gray-800">
        Votre photo
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="block mt-1" />
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

      {photo && (
        <div className="space-y-4 border rounded-xl p-4">
          <div>
            <p className="font-semibold text-gray-800 mb-2">Ajuster la photo</p>
            <div className="flex justify-center">
              <div
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
                className="cursor-move touch-none overflow-hidden bg-gray-100"
                style={{
                  width: PREVIEW_CROP_WIDTH,
                  maxWidth: '100%',
                  aspectRatio: `${zoneRatio}`,
                  borderRadius: shape === 'circle' ? '50%' : '8px',
                }}
              >
                <canvas ref={cropCanvasRef} className="w-full h-full block" />
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Faites glisser la photo pour la cadrer.</p>
          </div>

          <label className="block text-sm font-semibold text-gray-800">
            Zoom ({zoom.toFixed(1)}×)
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Forme</p>
            <div className="flex gap-2">
              {[
                { id: 'square', label: 'Carré' },
                { id: 'circle', label: 'Circulaire' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShape(s.id)}
                  className={choiceBtn(shape === s.id)}
                  style={shape === s.id ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Cadre</p>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrame(f.id)}
                  className={choiceBtn(frame === f.id)}
                  style={frame === f.id ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
        style={{ backgroundColor: accent }}
        className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
      >
        Télécharger mon badge (PNG)
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
