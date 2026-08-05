// src/components/volunteer/AuthCard.jsx
// Carte partagée par les formulaires "Mon espace" (connexion, inscription,
// mot de passe oublié, définir mot de passe) — évite de dupliquer le CSS
// dans chacun. Style aligné sur la charte publique du site (tokens CSS
// var(--col-*), pas le Tailwind violet admin) — voir AttestationForm.jsx
// pour le même principe de carte + tokens.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mesp-shell">
      <div className="mesp-card">
        <span className="mesp-tagline">AMP BÉNIN — Espace volontaire</span>
        <h1 className="mesp-title">{title}</h1>
        {subtitle && <p className="mesp-subtitle">{subtitle}</p>}
        {children}
      </div>

      <style>{`
        .mesp-shell {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--sp-8) var(--sp-4);
          background: var(--col-surface);
        }
        .mesp-card {
          width: 100%;
          max-width: 26rem;
          background: var(--col-white);
          border: 1px solid var(--col-border-light);
          border-radius: var(--r-2xl);
          padding: var(--sp-8);
          box-shadow: var(--sh-lg);
        }
        .mesp-tagline {
          display: block;
          font-size: var(--text-xs);
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--col-accent);
          margin-bottom: var(--sp-2);
        }
        .mesp-title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: var(--text-2xl);
          color: var(--col-primary);
          margin-bottom: var(--sp-2);
        }
        .mesp-subtitle {
          font-size: var(--text-sm);
          color: var(--col-text-sec);
          line-height: 1.6;
          margin-bottom: var(--sp-6);
        }
        .mesp-field { display: flex; flex-direction: column; gap: var(--sp-1); margin-bottom: var(--sp-4); }
        .mesp-label { font-size: var(--text-sm); font-weight: 600; color: var(--col-text); }
        .mesp-input {
          width: 100%;
          padding: var(--sp-3) var(--sp-4);
          background: var(--col-bg);
          border: 1.5px solid var(--col-border);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--col-text);
          outline: none;
          transition: border-color var(--tr-base), box-shadow var(--tr-base);
        }
        .mesp-input:focus { border-color: var(--col-primary); box-shadow: 0 0 0 3px rgba(27,67,50,0.12); }
        .mesp-btn {
          width: 100%;
          padding: var(--sp-3) var(--sp-6);
          background: var(--col-primary);
          color: var(--col-white);
          border: none;
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-weight: 700;
          font-size: var(--text-base);
          cursor: pointer;
          transition: background var(--tr-base), transform var(--tr-base);
        }
        .mesp-btn:hover:not(:disabled) { background: var(--col-primary-light); transform: scale(1.01); }
        .mesp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .mesp-error {
          background: rgba(220,38,38,0.07);
          color: #dc2626;
          font-size: var(--text-sm);
          font-weight: 600;
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-lg);
          margin-bottom: var(--sp-4);
        }
        .mesp-success {
          background: rgba(27,67,50,0.08);
          color: var(--col-primary);
          font-size: var(--text-sm);
          line-height: 1.6;
          padding: var(--sp-4);
          border-radius: var(--r-lg);
          margin-bottom: var(--sp-4);
        }
        .mesp-links { margin-top: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-2); text-align: center; }
        .mesp-links a { color: var(--col-accent-dark); font-weight: 600; font-size: var(--text-sm); text-decoration: none; }
        .mesp-links a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
