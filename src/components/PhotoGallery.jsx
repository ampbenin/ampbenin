// Composant générique de galerie photo avec lightbox, fusionnant
// ArticlePhotoGallery.jsx et PlaidoyerPhotoGallery.jsx (quasi-doublons) —
// voir plan de refonte, phase 4. `theme` choisit l'accent visuel
// (les deux articles historiques utilisaient des palettes différentes).
import { useState } from "react";

const THEMES = {
  green: {
    accent: "#2a7a2a",
    accentLight: "#4a8a4a",
    overlay: "rgba(42, 122, 42, 0.35)",
    placeholderFrom: "#1e3a1e",
    placeholderTo: "#2d5a2d",
    lightboxBg: "#0f1f0f",
    imgBg: "#1a2e1a",
  },
  purple: {
    accent: "#7c4fcf",
    accentLight: "#6a4ab8",
    overlay: "rgba(99, 60, 180, 0.35)",
    placeholderFrom: "#1a1035",
    placeholderTo: "#2d1a5a",
    lightboxBg: "#120a28",
    imgBg: "#1a1035",
  },
};

export default function PhotoGallery({ photos = [], theme = "green" }) {
  const [active, setActive] = useState(null);
  const c = THEMES[theme] || THEMES.green;

  if (!photos.length) return null;

  return (
    <section
      className="gallery-section"
      aria-label="Galerie photos"
      style={{
        "--gallery-accent": c.accent,
        "--gallery-accent-light": c.accentLight,
        "--gallery-overlay": c.overlay,
        "--gallery-placeholder-from": c.placeholderFrom,
        "--gallery-placeholder-to": c.placeholderTo,
        "--gallery-lightbox-bg": c.lightboxBg,
        "--gallery-img-bg": c.imgBg,
      }}
    >
      <div className="gallery-grid">
        {photos.map((photo, i) => {
          const src = photo.image || photo.src;
          const caption = photo.caption || "";
          return (
            <button
              key={photo.id || i}
              className="gallery-item"
              onClick={() => setActive(photo)}
              aria-label={`Agrandir : ${caption}`}
            >
              <div className="gallery-img-wrap">
                <img
                  src={src}
                  alt={photo.alt || caption}
                  loading={i < 2 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="gallery-placeholder" aria-hidden="true">
                  <span className="gallery-placeholder-icon">📷</span>
                  {photo.label && <span className="gallery-placeholder-label">{photo.label}</span>}
                </div>
                <div className="gallery-overlay">
                  <span className="gallery-overlay-icon">🔍</span>
                </div>
              </div>
              <div className="gallery-caption">
                <span className="gallery-num">{String(i + 1).padStart(2, "0")}</span>
                <p>{caption}</p>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={() => setActive(null)}
        >
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActive(null)} aria-label="Fermer">✕</button>
            <img src={active.image || active.src} alt={active.alt || active.caption} />
            <p className="lightbox-caption">{active.caption}</p>
          </div>
        </div>
      )}

      <style>{`
        .gallery-section { margin: 2.5rem 0 3rem; }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.85rem;
        }
        @media (max-width: 860px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .gallery-grid { grid-template-columns: 1fr; } }

        .gallery-item {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          border-radius: 10px;
          overflow: hidden;
          text-align: left;
          transition: transform 0.22s ease;
        }
        .gallery-item:hover { transform: translateY(-5px); }

        .gallery-img-wrap {
          width: 100%;
          aspect-ratio: 4/3;
          background: var(--gallery-img-bg);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .gallery-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.38s ease;
        }
        .gallery-item:hover .gallery-img-wrap img { transform: scale(1.05); }

        .gallery-overlay {
          position: absolute;
          inset: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s;
          border-radius: 10px;
        }
        .gallery-item:hover .gallery-overlay { background: var(--gallery-overlay); }
        .gallery-overlay-icon {
          font-size: 1.6rem;
          opacity: 0;
          transform: scale(0.7);
          transition: opacity 0.2s, transform 0.2s;
        }
        .gallery-item:hover .gallery-overlay-icon { opacity: 1; transform: scale(1); }

        .gallery-placeholder {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--gallery-placeholder-from) 0%, var(--gallery-placeholder-to) 100%);
          border: 2px dashed var(--gallery-accent-light);
          border-radius: 10px;
          position: absolute;
          inset: 0;
          color: #e8e8f0;
        }
        .gallery-placeholder-icon { font-size: 2rem; }
        .gallery-placeholder-label {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .gallery-caption {
          display: flex;
          gap: 0.55rem;
          align-items: flex-start;
          padding: 0 0.15rem;
        }
        .gallery-num {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--gallery-accent);
          letter-spacing: 0.04em;
          flex-shrink: 0;
          margin-top: 0.1rem;
          font-variant-numeric: tabular-nums;
        }
        .gallery-caption p {
          margin: 0;
          font-size: 0.76rem;
          color: #555;
          line-height: 1.4;
        }

        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(10,5,30,0.90);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: lbFade 0.2s ease;
        }
        @keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }
        .lightbox-inner {
          position: relative;
          max-width: 840px;
          width: 100%;
          background: var(--gallery-lightbox-bg);
          border-radius: 14px;
          overflow: hidden;
          padding-bottom: 1rem;
          border: 1px solid var(--gallery-accent-light);
        }
        .lightbox-inner img {
          width: 100%;
          max-height: 68vh;
          object-fit: contain;
          display: block;
          background: var(--gallery-img-bg);
        }
        .lightbox-caption {
          padding: 0.8rem 1.25rem 0;
          color: #d8d0f0;
          font-size: 0.84rem;
          line-height: 1.5;
          margin: 0;
        }
        .lightbox-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(120,80,200,0.5);
          border: none;
          color: #fff;
          font-size: 1rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          cursor: pointer;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-close:hover { background: var(--gallery-accent); }
      `}</style>
    </section>
  );
}
