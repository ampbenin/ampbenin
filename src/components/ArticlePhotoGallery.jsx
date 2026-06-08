import { useState } from "react";

const photos = [
  {
    id: 1,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780848303/Capture1111_ap0rca.png",
    alt: "Focus groupe en ligne – 34 jeunes de Gogounou, 18-20 mai 2026",
    caption: "Focus groupe en ligne réunissant 34 jeunes participants de la commune de Gogounou (18-20 mai 2026)",
    label: "Focus Groupe",
  },
  {
    id: 2,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780780745/famille_sori_hzaj8f.jpg",
    alt: "Activité de terrain à Sori – formation des jeunes leaders, 23 mai 2026",
    caption: "Activité communautaire de terrain dans l'arrondissement de Sori, commune de Gogounou (23 mai 2026)",
    label: "Terrain Sori",
  },
  {
    id: 3,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780780745/ec_form_sori_cauntg.jpg",
    alt: "Session de formation – désinformation et citoyenneté numérique",
    caption: "Session interactive animée par M. Fiacre TCHISSOU sur l'identification des contenus trompeurs",
    label: "Formation",
  },
  {
    id: 4,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780780745/echange_foor_jlfltl.jpg",
    alt: "Jeunes relais communautaires MyCountry229 à Gogounou",
    caption: "Les 20 jeunes relais communautaires engagés à diffuser les bonnes pratiques numériques dans leurs localités",
    label: "Relais Communautaires",
  },
];

export default function ArticlePhotoGallery() {
  const [active, setActive] = useState(null);

  return (
    <section className="gallery-section" aria-label="Galerie photos de l'activité">
      {/* Hero row: 2 large top photos */}
      <div className="gallery-grid">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            className={`gallery-item gallery-item--${i + 1}`}
            onClick={() => setActive(photo)}
            aria-label={`Agrandir : ${photo.caption}`}
          >
            <div className="gallery-img-wrap">
              {/* PLACEHOLDER – remplacez src par le vrai chemin de votre photo */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="gallery-placeholder" aria-hidden="true">
                <span className="gallery-placeholder-icon">📷</span>
                <span className="gallery-placeholder-label">{photo.label}</span>
                <span className="gallery-placeholder-hint">Photo {photo.id}</span>
              </div>
            </div>
            <div className="gallery-caption">
              <span className="gallery-tag">#{i + 1}</span>
              <p>{photo.caption}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={() => setActive(null)}
        >
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setActive(null)}
              aria-label="Fermer"
            >
              ✕
            </button>
            <img src={active.src} alt={active.alt} />
            <p className="lightbox-caption">{active.caption}</p>
          </div>
        </div>
      )}

      <style>{`
        .gallery-section {
          margin: 3rem 0;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: auto auto;
          gap: 1rem;
        }

        @media (max-width: 900px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }
        }

        .gallery-item {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          text-align: left;
        }
        .gallery-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        }

        .gallery-img-wrap {
          width: 100%;
          aspect-ratio: 4/3;
          background: #1a2e1a;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .gallery-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }
        .gallery-item:hover .gallery-img-wrap img {
          transform: scale(1.04);
        }

        .gallery-placeholder {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1e3a1e 0%, #2d5a2d 100%);
          border: 2px dashed #4a8a4a;
          border-radius: 10px;
          position: absolute;
          inset: 0;
          color: #a0d4a0;
          font-family: inherit;
        }
        .gallery-placeholder-icon { font-size: 2rem; }
        .gallery-placeholder-label {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #c8e8c8;
          text-transform: uppercase;
        }
        .gallery-placeholder-hint {
          font-size: 0.72rem;
          opacity: 0.7;
        }

        .gallery-caption {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          padding: 0 0.25rem;
        }
        .gallery-tag {
          background: #2a7a2a;
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .gallery-caption p {
          margin: 0;
          font-size: 0.78rem;
          color: #555;
          line-height: 1.4;
        }

        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.88);
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
          max-width: 820px;
          width: 100%;
          background: #0f1f0f;
          border-radius: 14px;
          overflow: hidden;
          padding-bottom: 1rem;
        }
        .lightbox-inner img {
          width: 100%;
          max-height: 70vh;
          object-fit: contain;
          display: block;
          background: #1a2e1a;
        }
        .lightbox-caption {
          padding: 0.75rem 1.25rem 0;
          color: #c8e8c8;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
        }
        .lightbox-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(0,0,0,0.6);
          border: none;
          color: #fff;
          font-size: 1.1rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          cursor: pointer;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </section>
  );
}
