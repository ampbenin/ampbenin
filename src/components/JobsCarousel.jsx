// components/JobsCarousel.jsx
// Logique de recherche/filtre/modal (useState, filter, iframe Google Drive) conservée à l'identique
import { useState } from "react";

const jobsData = [
  { id: 1, title: "1 Structure pour la réalisation d'études de terrain et la planification du projet NumSAL", category: "Consultance", location: "Tori-Bossito", file: "https://drive.google.com/file/d/1Ve5iz0Zwodwhwy3av0CfaU4iX6BP-xyU/view?usp=drive_link" },
  { id: 2, title: "1 Structure spécialisée pour l'installation, la fourniture de connexion internet et la maintenance", category: "Consultance", location: "Bénin", file: "https://drive.google.com/file/d/1qkM_By6IGZvbW2gnV7HmfYtEbsKz7VGn/view?usp=sharing" },
  { id: 3, title: "4 Consultants individuels pour la conception de modules pédagogiques en compétences numériques – Projet NumSAL", category: "Consultance", location: "Bénin", file: "https://drive.google.com/file/d/1_lui4qod9aiNgVJgnH7z651T-ERhfaWq/view?usp=drive_link" },
  { id: 4, title: "1 Éditeur pédagogique pour l'accompagnement à la conception des modules pédagogiques – Projet NumSAL", category: "Emploi", location: "Tori-Bossito", file: "https://drive.google.com/file/d/11b0Qqzv5Zgzep6vPyoBJifS17iszRVpG/view?usp=drive_link" },
  { id: 5, title: "2 Coach-formateurs pour l'animation des modules de formation en compétences numériques – Projet NumSAL", category: "Emploi", location: "Bénin", file: "https://drive.google.com/file/d/1BqkU64zoGN8uNjnB5pkG__XaXYnrjLZV/view?usp=sharing" },
  { id: 6, title: "2 Coachs assistants pour l'appui à l'animation des formations en compétences numériques – Projet NumSAL", category: "Emploi", location: "Tori-Bossito", file: "https://drive.google.com/file/d/1qr_tySQgb7HFyfbz2xF9QAtzBn7vk3bg/view?usp=sharing" },
];

const CATEGORY_COLORS = {
  Consultance: { bg: "#1B4332", text: "#ffffff" },
  Emploi:      { bg: "#C9903A", text: "#ffffff" },
  Formation:   { bg: "#0369A1", text: "#ffffff" },
};

export default function JobsCarousel() {
  // Logique identique
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("All");
  const [selectedPdf, setSelectedPdf] = useState(null);

  const filteredJobs = jobsData.filter((job) =>
    (filter === "All" || job.category === filter) &&
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="jobs-wrap">

      {/* Barre de filtres */}
      <div className="jobs-filters">

        {/* Recherche */}
        <div className="jobs-search-wrap">
          <svg className="jobs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Rechercher une offre…"
            className="jobs-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une offre"
          />
        </div>

        {/* Catégorie */}
        <select
          className="jobs-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="All">Toutes les catégories</option>
          <option value="Consultance">Consultance</option>
          <option value="Formation">Formation</option>
          <option value="Emploi">Emploi</option>
        </select>

        {/* Compteur de résultats */}
        <span className="jobs-count">
          {filteredJobs.length} offre{filteredJobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grille */}
      <div className="jobs-grid">
        {filteredJobs.length > 0 ? filteredJobs.map((job) => {
          const catStyle = CATEGORY_COLORS[job.category] || { bg: "#1B4332", text: "#fff" };
          return (
            <article key={job.id} className="job-card">

              {/* Badges */}
              <div className="job-card__badges">
                <span
                  className="job-card__cat"
                  style={{ background: catStyle.bg, color: catStyle.text }}
                >
                  {job.category}
                </span>
                <span className="job-card__tdr">TDR</span>
              </div>

              {/* Titre */}
              <h3 className="job-card__title">{job.title}</h3>

              {/* Meta */}
              <p className="job-card__meta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{width:"0.9rem",height:"0.9rem",flexShrink:0}}>
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {job.location}
              </p>

              {/* Actions */}
              <div className="job-card__actions">
                <button
                  onClick={() => setSelectedPdf(job.file.replace("/view", "/preview"))}
                  className="job-card__btn job-card__btn--primary"
                  aria-label={`Aperçu : ${job.title}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Aperçu
                </button>
                <a
                  href={job.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="job-card__btn job-card__btn--outline"
                  aria-label={`Télécharger : ${job.title}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger
                </a>
              </div>
            </article>
          );
        }) : (
          <p className="jobs-empty">Aucune offre ne correspond à votre recherche.</p>
        )}
      </div>

      {/* Modal aperçu PDF */}
      {selectedPdf && (
        <div
          className="jobs-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPdf(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu du document"
        >
          <div className="jobs-modal">
            <button
              onClick={() => setSelectedPdf(null)}
              className="jobs-modal__close"
              aria-label="Fermer l'aperçu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <iframe
              src={selectedPdf}
              title="Aperçu du document"
              className="jobs-modal__iframe"
            />
          </div>
        </div>
      )}

      <style>{`
        .jobs-wrap {
          width: 100%;
          font-family: var(--font-body);
        }

        /* Filtres */
        .jobs-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--sp-3);
          margin-bottom: var(--sp-8);
        }
        .jobs-search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .jobs-search-icon {
          position: absolute;
          left: var(--sp-3);
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          color: var(--col-text-muted);
          pointer-events: none;
        }
        .jobs-search {
          width: 100%;
          padding: var(--sp-3) var(--sp-4) var(--sp-3) calc(var(--sp-3) + 1.5rem);
          background: var(--col-white);
          border: 1.5px solid var(--col-border);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--col-text);
          outline: none;
          box-shadow: var(--sh-sm);
          transition: border-color var(--tr-base), box-shadow var(--tr-base);
        }
        .jobs-search:focus {
          border-color: var(--col-primary);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
        }
        .jobs-select {
          padding: var(--sp-3) var(--sp-8) var(--sp-3) var(--sp-4);
          background: var(--col-white);
          border: 1.5px solid var(--col-border);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--col-text);
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B4332' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right var(--sp-3) center;
          background-size: 1rem;
          box-shadow: var(--sh-sm);
          transition: border-color var(--tr-base), box-shadow var(--tr-base);
        }
        .jobs-select:focus {
          border-color: var(--col-primary);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
        }
        .jobs-count {
          font-size: var(--text-sm);
          color: var(--col-text-muted);
          white-space: nowrap;
          margin-left: auto;
        }

        /* Grille */
        .jobs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--sp-5);
        }
        @media (min-width: 640px)  { .jobs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .jobs-grid { grid-template-columns: repeat(3, 1fr); } }

        .jobs-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--sp-16);
          font-size: var(--text-base);
          color: var(--col-text-muted);
        }

        /* Carte offre */
        .job-card {
          background: var(--col-white);
          border: 1px solid var(--col-border-light);
          border-radius: var(--r-2xl);
          padding: var(--sp-6);
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
          box-shadow: var(--sh-sm);
          transition: transform var(--tr-base), box-shadow var(--tr-base);
        }
        .job-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--sh-lg);
        }

        .job-card__badges {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          flex-wrap: wrap;
        }
        .job-card__cat {
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: var(--sp-1) var(--sp-3);
          border-radius: var(--r-full);
        }
        .job-card__tdr {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--col-text-muted);
          background: var(--col-surface);
          border: 1px solid var(--col-border);
          padding: var(--sp-1) var(--sp-3);
          border-radius: var(--r-full);
          letter-spacing: 0.04em;
        }

        .job-card__title {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: var(--text-base);
          color: var(--col-primary);
          line-height: 1.4;
          flex: 1;
        }

        .job-card__meta {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--text-sm);
          color: var(--col-text-muted);
        }

        .job-card__actions {
          display: flex;
          gap: var(--sp-3);
          flex-wrap: wrap;
          margin-top: auto;
        }
        .job-card__btn {
          display: inline-flex;
          align-items: center;
          gap: var(--sp-2);
          padding: var(--sp-2) var(--sp-4);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background var(--tr-base), transform var(--tr-base), box-shadow var(--tr-base), color var(--tr-base), border-color var(--tr-base);
          border: 1.5px solid transparent;
        }
        .job-card__btn svg { width: 0.95rem; height: 0.95rem; flex-shrink: 0; }
        .job-card__btn:hover { transform: scale(1.03); }
        .job-card__btn:focus-visible { outline: 2px solid var(--col-primary); outline-offset: 3px; }

        .job-card__btn--primary {
          background: var(--col-primary);
          color: var(--col-white);
          border-color: var(--col-primary);
        }
        .job-card__btn--primary:hover { background: var(--col-primary-light); border-color: var(--col-primary-light); }

        .job-card__btn--outline {
          background: transparent;
          color: var(--col-primary);
          border-color: var(--col-primary);
        }
        .job-card__btn--outline:hover { background: var(--col-primary-bg); }

        /* Modal */
        .jobs-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: var(--sp-4);
          backdrop-filter: blur(4px);
        }
        .jobs-modal {
          position: relative;
          width: 90%;
          height: 90vh;
          background: var(--col-white);
          border-radius: var(--r-2xl);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.30);
          overflow: hidden;
        }
        .jobs-modal__close {
          position: absolute;
          top: var(--sp-3);
          right: var(--sp-3);
          z-index: 10;
          width: 2.25rem;
          height: 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--col-primary);
          color: var(--col-white);
          border: none;
          border-radius: var(--r-full);
          cursor: pointer;
          transition: background var(--tr-base), transform var(--tr-base);
        }
        .jobs-modal__close svg { width: 1rem; height: 1rem; }
        .jobs-modal__close:hover { background: #dc2626; transform: scale(1.08); }
        .jobs-modal__close:focus-visible { outline: 2px solid var(--col-accent); outline-offset: 3px; }

        .jobs-modal__iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>
    </div>
  );
}
