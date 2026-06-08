// src/components/AttestationForm.jsx
// Logique 4 étapes, framer-motion, tous les appels API conservés à l'identique
import { useState } from "react";
import { motion } from "framer-motion";

export default function AttestationForm() {
  const [email,           setEmail]           = useState("");
  const [nom,             setNom]             = useState("");
  const [missions,        setMissions]        = useState([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [downloadUrl,     setDownloadUrl]     = useState("");
  const [message,         setMessage]         = useState("");
  const [loading,         setLoading]         = useState(false);
  const [downloading,     setDownloading]     = useState(false);
  const [step,            setStep]            = useState(1); // 1 = vérification, 2 = mission, 3 = téléchargement, 4 = terminé

  const API_BASE =
    import.meta.env.MODE === "development"
      ? "https://potential-rafa-amp1-00541efa.koyeb.app/api/certificates"
      : "https://potential-rafa-amp1-00541efa.koyeb.app/api/certificates";

  // Étape I : Vérifier volontaire — logique identique
  const checkVolontaire = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMissions([]);
    setDownloadUrl("");

    try {
      const res  = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom }),
      });
      const data = await res.json();

      if (!res.ok) { setMessage(data.message || "Erreur serveur"); return; }

      if (data.missions) {
        setMissions(data.missions);
        setMessage("Sélectionnez votre mission pour continuer.");
        setStep(2);
      } else {
        setMessage(data.message || "Aucune mission assignée.");
      }
    } catch {
      setMessage("Erreur lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Étape II : Récupérer attestation — logique identique
  const fetchCertificate = async () => {
    if (!selectedMission) return;
    setLoading(true);
    setMessage("");
    setDownloadUrl("");

    try {
      const res  = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom, titre: selectedMission }),
      });
      const data = await res.json();

      if (!res.ok) { setMessage(data.message || "Erreur serveur"); return; }

      if (data.url) {
        setDownloadUrl(data.url);
        setMessage("Attestation prête au téléchargement !");
        setStep(3);
      } else {
        setMessage(data.message || "Aucune attestation disponible.");
      }
    } catch {
      setMessage("Erreur lors de la récupération de l'attestation.");
    } finally {
      setLoading(false);
    }
  };

  // Étape III : Télécharger PDF — logique identique
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const response = await fetch(`${downloadUrl}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur téléchargement");

      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `attestation_${selectedMission}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("");
      setStep(4);
    } catch (err) {
      console.error("Erreur téléchargement :", err);
      alert("Impossible de télécharger le fichier");
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  // Indicateur d'étapes
  const STEPS = ["Identification", "Mission", "Attestation", "Terminé"];

  return (
    <motion.div
      className="attest-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Indicateur de progression */}
      <div className="attest-steps" aria-label="Étapes">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isDone    = step > stepNum;
          const isActive  = step === stepNum;
          return (
            <div key={label} className={`attest-step ${isActive ? "attest-step--active" : ""} ${isDone ? "attest-step--done" : ""}`}>
              <div className="attest-step__circle" aria-hidden="true">
                {isDone ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : stepNum}
              </div>
              <span className="attest-step__label">{label}</span>
              {i < STEPS.length - 1 && <div className="attest-step__line" aria-hidden="true"></div>}
            </div>
          );
        })}
      </div>

      {/* En-tête (masqué à l'étape 4) */}
      {step !== 4 && (
        <div className="attest-header">
          <h3 className="attest-tagline">Espace des Volontaires AMP BENIN</h3>
          <h2 className="attest-title">Vérification d'attestation</h2>
        </div>
      )}

      {/* ── Étape 1 : Identification ── */}
      {step === 1 && (
        <form className="attest-form" onSubmit={checkVolontaire}>
          <div className="attest-field">
            <label htmlFor="attest-email" className="attest-label">Adresse e-mail</label>
            <input
              id="attest-email"
              type="email"
              placeholder="votre@email.com"
              className="attest-input"
              value={email}
              maxLength={40}
              onChange={(e) => setEmail(e.target.value.slice(0, 40))}
              required
              autoComplete="email"
            />
          </div>

          <div className="attest-field">
            <label htmlFor="attest-nom" className="attest-label">Nom de famille</label>
            <input
              id="attest-nom"
              type="text"
              placeholder="NOM (en majuscules)"
              className="attest-input attest-input--upper"
              value={nom}
              maxLength={30}
              onChange={(e) => {
                const formatted = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z '\-]/g, "")
                  .slice(0, 30);
                setNom(formatted);
              }}
              required
              autoComplete="family-name"
            />
          </div>

          <button type="submit" className="attest-btn attest-btn--primary" disabled={loading}>
            {loading ? <span className="attest-spinner" aria-label="Chargement…"></span> : "Vérifier mon identité"}
          </button>
        </form>
      )}

      {/* ── Étape 2 : Sélection mission ── */}
      {step === 2 && (
        <motion.div className="attest-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="attest-field">
            <label htmlFor="attest-mission" className="attest-label">Votre mission</label>
            <select
              id="attest-mission"
              className="attest-select"
              value={selectedMission}
              onChange={(e) => setSelectedMission(e.target.value)}
            >
              <option value="">-- Sélectionner votre mission --</option>
              {missions.map((m, idx) => (
                <option key={idx} value={m.titre}>{m.titre}</option>
              ))}
            </select>
          </div>

          <div className="attest-row">
            <button type="button" onClick={() => setStep(1)} className="attest-btn attest-btn--ghost">
              ← Précédent
            </button>
            <button
              className="attest-btn attest-btn--primary attest-btn--grow"
              onClick={fetchCertificate}
              disabled={loading || !selectedMission}
            >
              {loading ? <span className="attest-spinner" aria-label="Chargement…"></span> : "Récupérer l'attestation"}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Étape 3 : Téléchargement ── */}
      {step === 3 && (
        <motion.div className="attest-form attest-form--center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="attest-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="attest-success-text">
            Félicitations ! Vous avez terminé avec succès cette mission.<br />
            AMP BENIN vous remercie pour votre engagement.
          </p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`attest-btn attest-btn--accent${downloading ? " attest-btn--loading" : ""}`}
          >
            {downloading ? (
              <span className="attest-spinner" aria-label="Téléchargement…"></span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{width:"1.1rem",height:"1.1rem"}}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger le PDF
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* ── Étape 4 : Terminé ── */}
      {step === 4 && (
        <motion.div className="attest-form attest-form--center attest-final" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="attest-final__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
          <h3 className="attest-final__title">Attestation téléchargée !</h3>
          <p className="attest-final__text">
            Merci pour votre engagement continu au sein d'AMP BENIN. Votre attestation a été enregistrée dans votre dossier de volontaire.
          </p>
        </motion.div>
      )}

      {/* Message contextuel (masqué à l'étape 4) */}
      {message && step !== 4 && (
        <p className={`attest-msg ${downloadUrl ? "attest-msg--success" : "attest-msg--error"}`} role="status">
          {message}
        </p>
      )}

      <style>{`
        .attest-card {
          max-width: 32rem;
          margin-inline: auto;
          background: var(--col-white);
          border: 1px solid var(--col-border-light);
          border-radius: var(--r-2xl);
          padding: var(--sp-8);
          box-shadow: var(--sh-lg);
          font-family: var(--font-body);
        }

        /* Indicateur d'étapes */
        .attest-steps {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0;
          margin-bottom: var(--sp-8);
          overflow: hidden;
        }
        .attest-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
          gap: var(--sp-2);
        }
        .attest-step__circle {
          width: 2rem;
          height: 2rem;
          border-radius: var(--r-full);
          background: var(--col-border);
          color: var(--col-text-muted);
          font-size: var(--text-sm);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: background var(--tr-base), color var(--tr-base);
          flex-shrink: 0;
        }
        .attest-step__circle svg { width: 0.9rem; height: 0.9rem; }
        .attest-step--active .attest-step__circle {
          background: var(--col-primary);
          color: var(--col-white);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.18);
        }
        .attest-step--done .attest-step__circle {
          background: var(--col-accent);
          color: var(--col-white);
        }
        .attest-step__label {
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--col-text-muted);
          text-align: center;
          line-height: 1.2;
        }
        .attest-step--active .attest-step__label { color: var(--col-primary); font-weight: 600; }
        .attest-step--done .attest-step__label   { color: var(--col-accent); }
        .attest-step__line {
          position: absolute;
          top: 1rem;
          left: calc(50% + 1rem);
          right: calc(-50% + 1rem);
          height: 2px;
          background: var(--col-border-light);
          z-index: 1;
        }
        .attest-step--done .attest-step__line + .attest-step .attest-step__line {
          background: var(--col-accent);
        }

        /* En-tête */
        .attest-header { margin-bottom: var(--sp-7); text-align: center; }
        .attest-tagline {
          font-size: var(--text-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--col-accent);
          margin-bottom: var(--sp-2);
        }
        .attest-title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: var(--text-2xl);
          color: var(--col-primary);
        }

        /* Formulaires */
        .attest-form {
          display: flex;
          flex-direction: column;
          gap: var(--sp-5);
        }
        .attest-form--center { align-items: center; text-align: center; }

        .attest-field { display: flex; flex-direction: column; gap: var(--sp-1); }
        .attest-label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--col-text);
        }
        .attest-input,
        .attest-select {
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
        .attest-input::placeholder { color: var(--col-text-muted); }
        .attest-input:focus,
        .attest-select:focus {
          border-color: var(--col-primary);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
        }
        .attest-input--upper { text-transform: uppercase; letter-spacing: 0.04em; }
        .attest-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B4332' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right var(--sp-3) center;
          background-size: 1rem;
          padding-right: var(--sp-10);
          cursor: pointer;
        }

        /* Boutons */
        .attest-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-2);
          padding: var(--sp-3) var(--sp-6);
          border-radius: var(--r-lg);
          font-family: var(--font-body);
          font-size: var(--text-base);
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background var(--tr-base), transform var(--tr-base), opacity var(--tr-base);
          width: 100%;
        }
        .attest-btn:hover:not(:disabled) { transform: scale(1.02); }
        .attest-btn:focus-visible { outline: 2px solid var(--col-primary); outline-offset: 3px; }
        .attest-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .attest-btn--grow { flex: 1; width: auto; }

        .attest-btn--primary { background: var(--col-primary); color: var(--col-white); }
        .attest-btn--primary:hover:not(:disabled) { background: var(--col-primary-light); }

        .attest-btn--accent { background: var(--col-accent); color: var(--col-white); box-shadow: 0 4px 14px rgba(201,144,58,0.35); }
        .attest-btn--accent:hover:not(:disabled) { background: #b8812e; }
        .attest-btn--loading { background: #d9a65e; }

        .attest-btn--ghost {
          background: transparent;
          color: var(--col-text-sec);
          border-color: var(--col-border);
          width: auto;
          flex-shrink: 0;
        }
        .attest-btn--ghost:hover:not(:disabled) { background: var(--col-surface); }

        .attest-row { display: flex; gap: var(--sp-3); }

        /* Spinner */
        .attest-spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: var(--col-white);
          border-radius: 50%;
          animation: attest-spin 0.7s linear infinite;
        }
        @keyframes attest-spin { to { transform: rotate(360deg); } }

        /* Icône succès */
        .attest-success-icon {
          width: 4rem;
          height: 4rem;
          background: rgba(27,67,50,0.08);
          border-radius: var(--r-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--col-primary);
          margin-bottom: var(--sp-3);
        }
        .attest-success-icon svg { width: 2rem; height: 2rem; }
        .attest-success-text {
          font-size: var(--text-base);
          color: var(--col-primary);
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: var(--sp-5);
        }

        /* Étape finale */
        .attest-final { padding: var(--sp-6) 0; }
        .attest-final__icon {
          width: 5rem;
          height: 5rem;
          background: linear-gradient(135deg, var(--col-primary), var(--col-primary-light));
          border-radius: var(--r-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--col-white);
          margin-bottom: var(--sp-4);
          box-shadow: 0 8px 24px rgba(27,67,50,0.25);
        }
        .attest-final__icon svg { width: 2.5rem; height: 2.5rem; }
        .attest-final__title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: var(--text-2xl);
          color: var(--col-primary);
          margin-bottom: var(--sp-3);
        }
        .attest-final__text {
          font-size: var(--text-base);
          color: var(--col-text-sec);
          line-height: 1.7;
          max-width: 26rem;
        }

        /* Message retour */
        .attest-msg {
          margin-top: var(--sp-5);
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-lg);
          font-size: var(--text-sm);
          font-weight: 600;
          text-align: center;
        }
        .attest-msg--success { background: rgba(27,67,50,0.08); color: var(--col-primary); }
        .attest-msg--error   { background: rgba(220,38,38,0.07); color: #dc2626; }
      `}</style>
    </motion.div>
  );
}
