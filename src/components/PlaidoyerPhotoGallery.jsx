import { useState } from "react";

const photos = [
  {
    id: 1,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780848303/Capture1111_ap0rca.png",
    alt: "Focus group AMP BENIN – leaders communautaires et jeunes réunis pour élaborer le plan de plaidoyer",
    caption: "Vue d'ensemble du focus group réunissant leaders communautaires, jeunes et acteurs de la société civile",
    label: "Focus Group",
  },
  {
    id: 2,
    src: "/https://res.cloudinary.com/di21pnpda/image/upload/v1780848293/111111_oldags.png",
    alt: "Participants en atelier – identification des formes de désinformation dans les communautés",
    caption: "Atelier participatif d'identification des formes de désinformation observées dans les communautés locales",
    label: "Atelier",
  },
  {
    id: 3,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780904134/22_snb5gg.jpg",
    alt: "Co-construction des stratégies communautaires de lutte contre la désinformation",
    caption: "Séance de co-construction des stratégies et orientations du plan de plaidoyer communautaire",
    label: "Co-construction",
  },
  {
    id: 4,
    src: "https://res.cloudinary.com/di21pnpda/image/upload/v1780780745/staff_sori_tvvtcx.jpg",
    alt: "Restitution et validation des orientations du plan de plaidoyer AMP BENIN",
    caption: "Restitution collective et validation des orientations stratégiques du plan de plaidoyer communautaire",
    label: "Restitution",
  },
];

export default function PlaidoyerPhotoGallery() {
  const [active, setActive] = useState(null);

  return (
    <section className="gallery-section" aria-label="Galerie photos du focus group plaidoyer">
      <div className="gallery-grid">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            className="gallery-item"
            onClick={() => setActive(photo)}
            aria-label={`Agrandir : ${photo.caption}`}
          >
            <div className="gallery-img-wrap">
              <img
                src={photo.src}
                alt={photo.alt}
                loading={i < 2 ? "eager" : "lazy"}
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
              <div className="gallery-overlay">
                <span className="gallery-overlay-icon">🔍</span>
              </div>
            </div>
            <div className="gallery-caption">
              <span className="gallery-num">0{photo.id}</span>
              <p>{photo.caption}</p>
            </div>
          </button>
        ))}
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
            <img src={active.src} alt={active.alt} />
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
          background: #160e2e;
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
          background: rgba(99, 60, 180, 0.0);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s;
          border-radius: 10px;
        }
        .gallery-item:hover .gallery-overlay { background: rgba(99, 60, 180, 0.35); }
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
          background: linear-gradient(135deg, #1a1035 0%, #2d1a5a 100%);
          border: 2px dashed #6a4ab8;
          border-radius: 10px;
          position: absolute;
          inset: 0;
          color: #c8b8f0;
        }
        .gallery-placeholder-icon { font-size: 2rem; }
        .gallery-placeholder-label {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #d8c8ff;
        }
        .gallery-placeholder-hint { font-size: 0.7rem; opacity: 0.6; }

        .gallery-caption {
          display: flex;
          gap: 0.55rem;
          align-items: flex-start;
          padding: 0 0.15rem;
        }
        .gallery-num {
          font-size: 0.7rem;
          font-weight: 800;
          color: #7c4fcf;
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
          background: rgba(10,5,30,0.92);
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
          background: #120a28;
          border-radius: 14px;
          overflow: hidden;
          padding-bottom: 1rem;
          border: 1px solid rgba(120,80,200,0.3);
        }
        .lightbox-inner img {
          width: 100%;
          max-height: 68vh;
          object-fit: contain;
          display: block;
          background: #1a1035;
        }
        .lightbox-caption {
          padding: 0.8rem 1.25rem 0;
          color: #c8b8f0;
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
        .lightbox-close:hover { background: rgba(120,80,200,0.9); }
      `}</style>
    </section>
  );
}
