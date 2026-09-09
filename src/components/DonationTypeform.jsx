// src/components/DonationTypeform.jsx
// Formulaire de don plein écran, façon Typeform — une question à la fois,
// même famille visuelle que VolunteerApplicationForm.jsx (candidature
// volontaire), mais logique de champs propre au don (pas de fields[]
// dynamiques venant du serveur : les questions sont fixes ici).
//
// Le paiement et l'enregistrement du don sont entièrement gérés par le
// backend externe server-miss-culture-benin (voir services/donations/api.js)
// — ce composant ne fait qu'appeler POST /donations puis rediriger vers
// payment_url. Les infos du donateur ne transitent jamais ailleurs.
//
// `campaign` (optionnel) : { slug, title, messageTag, shortDescription }.
// L'API n'a pas de champ dédié "campagne" : on préfixe donc le message
// envoyé avec `[messageTag]` pour que l'équipe AMP puisse repérer
// manuellement les dons liés à cette collecte (pas de comptage automatique).
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDonationSettings,
  createDonation,
  getDonationCountries,
  getDonationOperators,
} from "../services/donations/api";

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000];
const DEFAULT_MIN_AMOUNT = 500;

const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

function validateAmount(value, minAmount) {
  const n = Number(value);
  if (isEmpty(value) || Number.isNaN(n) || n <= 0) return "Merci d'indiquer un montant valide.";
  if (n < minAmount) return `Le montant minimum pour un don est de ${minAmount.toLocaleString("fr-FR")} FCFA.`;
  return "";
}
function validateEmail(value) {
  if (isEmpty(value)) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? "" : "Cette adresse email n'est pas valide.";
}

export default function DonationTypeform({ campaign = null }) {
  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [donationsEnabled, setDonationsEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState(DEFAULT_MIN_AMOUNT);

  // CHANGED: routage Local/Afrique (voir server-miss-culture-benin/memory/
  // sebpay_integration.md) — `countries` vide = mode "local", l'étape pays
  // n'apparaît alors jamais dans `steps` ci-dessous (comportement identique
  // à avant cet ajout). Chargé en parallèle des réglages, best-effort : une
  // erreur ici laisse simplement le formulaire en FedaPay simple.
  const [countries, setCountries] = useState([]);
  const [operators, setOperators] = useState([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsError, setOperatorsError] = useState("");
  const [sebpayCountryNames, setSebpayCountryNames] = useState(null);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({ anonymous: null });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const inputRef = useRef(null);

  const backHref = campaign ? `/don/campagnes/${campaign.slug}` : "/don";

  const loadSettings = () => {
    setLoading(true);
    setSettingsError("");
    getDonationSettings()
      .then((data) => {
        setDonationsEnabled(!!data?.donationsEnabled);
        if (data?.donationMinAmount) setMinAmount(Number(data.donationMinAmount));
      })
      .catch((err) => setSettingsError(err.message || "Impossible de vérifier la disponibilité des dons."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
    // Best-effort : une erreur ici laisse `countries` vide, donc le
    // formulaire reste en FedaPay simple (comme avant cette fonctionnalité).
    getDonationCountries()
      .then((data) => setCountries(data?.countries || []))
      .catch(() => setCountries([]));
  }, []);

  const selectedCountry = countries.find((c) => c.code === answers.country) || null;
  const selectedProvider = selectedCountry?.provider || null;
  const selectedOperatorObj = operators.find((o) => o.slug === answers.operator) || null;

  // Charge les opérateurs dès qu'un pays routé SebPay est choisi (Étape 2.2,
  // même principe que TicketPurchase.jsx sur les autres sites du groupe) —
  // vérifie EN DIRECT contre SebPay, le mapping admin pouvant être périmé.
  useEffect(() => {
    if (selectedProvider !== "sebpay" || !answers.country) {
      setOperators([]);
      setOperatorsError("");
      setSebpayCountryNames(null);
      return;
    }
    setOperatorsLoading(true);
    setOperatorsError("");
    setSebpayCountryNames(null);
    getDonationOperators(answers.country)
      .then((data) => {
        if (!data?.available) {
          setOperatorsError(data?.message || "Pays non disponible actuellement");
          setSebpayCountryNames((data?.sebpayCountries || []).map((c) => c.name));
          setOperators([]);
          return;
        }
        setOperators(data.operators || []);
      })
      .catch((err) => setOperatorsError(err.message || "Erreur lors du chargement des opérateurs."))
      .finally(() => setOperatorsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.country, selectedProvider]);

  const steps = useMemo(() => {
    const list = [
      { id: "amount", type: "AMOUNT", label: "Quel montant souhaitez-vous donner ?" },
    ];
    if (countries.length > 0) {
      list.push({ id: "country", type: "COUNTRY", label: "Depuis quel pays donnez-vous ?" });
    }
    if (selectedProvider === "sebpay") {
      list.push({ id: "operator", type: "OPERATOR", label: "Quel est votre opérateur mobile money ?" });
      list.push({ id: "phone", type: "PHONE", label: "Votre numéro de téléphone mobile money ?" });
      if (selectedOperatorObj?.otpRequired) {
        list.push({
          id: "otpCode",
          type: "TEXT",
          label: `Code reçu après avoir composé ${selectedOperatorObj.ussdCode || "le code USSD"} sur votre téléphone`,
        });
      }
    }
    list.push({ id: "anonymous", type: "CHOICE", label: "Souhaitez-vous faire ce don anonymement ?" });
    if (answers.anonymous === false) {
      list.push(
        { id: "nom", type: "TEXT", label: "Quel est votre nom ?", hint: "Optionnel" },
        { id: "email", type: "EMAIL", label: "Votre adresse email ?", hint: "Optionnel — utile pour un futur reçu" },
      );
      // Déjà demandé ci-dessus si le mode "Afrique" est actif — pas besoin
      // de reposer la question une seconde fois.
      if (countries.length === 0) {
        list.push({ id: "pays", type: "TEXT", label: "Depuis quel pays donnez-vous ?", hint: "Optionnel" });
      }
    }
    list.push({ id: "message", type: "TEXTAREA", label: "Un mot pour l'équipe AMP BENIN ?", hint: "Optionnel" });
    return list;
  }, [answers.anonymous, countries, selectedProvider, selectedOperatorObj]);

  const totalSteps = steps.length;
  const isReview = currentIndex === totalSteps;
  const currentStep = !isReview ? steps[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, totalSteps));
  }, [totalSteps]);

  useEffect(() => {
    setStepError("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [currentIndex, started]);

  const setValue = (value) => {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  };

  const validateCurrent = () => {
    if (!currentStep) return "";
    const value = answers[currentStep.id];
    if (currentStep.id === "amount") return validateAmount(value, minAmount);
    if (currentStep.id === "country") return isEmpty(value) ? "Merci de choisir un pays." : "";
    if (currentStep.id === "operator") return isEmpty(value) ? "Merci de choisir un opérateur." : "";
    if (currentStep.id === "phone") return isEmpty(value) ? "Merci d'indiquer votre numéro mobile money." : "";
    if (currentStep.id === "otpCode") return isEmpty(value) ? "Merci d'indiquer le code reçu." : "";
    if (currentStep.id === "anonymous") return value === null || value === undefined ? "Merci de faire un choix." : "";
    if (currentStep.id === "email") return validateEmail(value);
    return "";
  };

  const goNext = () => {
    if (!currentStep) return;
    const err = validateCurrent();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setDirection("forward");
    setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setStepError("");
    setDirection("backward");
    setCurrentIndex((i) => i - 1);
  };

  const selectChoice = (value) => {
    setValue(value);
    setStepError("");
    setDirection("forward");
    setTimeout(() => setCurrentIndex((i) => i + 1), 260);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const rawMessage = (answers.message || "").trim();
      const message = campaign
        ? `[${campaign.messageTag}]${rawMessage ? " " + rawMessage : ""}`
        : (rawMessage || undefined);

      const payload = {
        montant: Number(answers.amount),
        anonymous: !!answers.anonymous,
        message,
      };
      // Pays choisi pour le routage du paiement (voir resolveProvider côté
      // backend) — absent en mode "local", auquel cas le champ n'a jamais
      // été demandé (voir `steps` ci-dessus).
      if (answers.country) payload.country = answers.country;
      if (!answers.anonymous) {
        // Réutilise le pays de paiement déjà choisi comme pays d'identité si
        // disponible (évite de reposer la même question deux fois — voir
        // `steps` ci-dessus, qui ne redemande "pays" en texte libre que si
        // aucun sélecteur de pays n'a été affiché).
        const paysValue = answers.pays?.trim() || selectedCountry?.name || undefined;
        payload.donor = {
          ...(answers.nom?.trim() && { nom: answers.nom.trim() }),
          ...(answers.email?.trim() && { email: answers.email.trim() }),
          ...(paysValue && { pays: paysValue }),
        };
      }
      // CHANGED: flux SebPay — `phone` est distinct de `donor` côté API
      // (mécanique du mobile money, indépendante de l'anonymat, voir
      // donation.controller.js) : envoyé même pour un don anonyme, mais
      // jamais conservé par le serveur dans ce cas.
      if (selectedProvider === "sebpay") {
        payload.phone = answers.phone;
        payload.operator = selectedOperatorObj?.code;
        if (selectedOperatorObj?.otpRequired) payload.otpCode = answers.otpCode;
      }

      const data = await createDonation(payload);

      if (data?.payment_url) {
        setRedirecting(true);
        window.location.href = data.payment_url;
        return;
      }
      // CHANGED: flux SebPay — pas de payment_url (collecte directe, pas de
      // redirection agrégateur). `providerLink` (observé avec Wave) doit
      // s'ouvrir dans un nouvel onglet ; dans tous les cas on bascule sur
      // l'écran d'attente /don/status, qui interroge le statut lui-même
      // (voir DonationStatus.jsx).
      if (data?.transactionId) {
        if (data.providerLink) {
          window.open(data.providerLink, "_blank", "noopener,noreferrer");
        }
        setRedirecting(true);
        window.location.href = `/don/status?provider=sebpay&id=${encodeURIComponent(data.transactionId)}`;
        return;
      }
      throw new Error("Réponse inattendue du serveur de dons.");
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de la création du don. Merci de réessayer.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dtf-shell dtf-shell--center">
        <p className="dtf-loading">Chargement...</p>
        <DonationTypeformStyles />
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="dtf-shell dtf-shell--center">
        <p className="dtf-fatal">{settingsError}</p>
        <button type="button" className="dtf-btn dtf-btn--primary" onClick={loadSettings}>Réessayer</button>
        <a href={backHref} className="dtf-btn dtf-btn--ghost">Retour</a>
        <DonationTypeformStyles />
      </div>
    );
  }

  if (!donationsEnabled) {
    return (
      <div className="dtf-shell dtf-shell--center">
        <div className="dtf-cover">
          <h1 className="dtf-cover__title">La collecte de dons est momentanément fermée</h1>
          <p className="dtf-cover__desc">
            Merci pour votre intérêt ! Revenez bientôt, ou contactez-nous pour toute autre façon de soutenir AMP BENIN.
          </p>
          <a href="/contact" className="dtf-btn dtf-btn--primary dtf-btn--lg">Nous contacter</a>
        </div>
        <DonationTypeformStyles />
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="dtf-shell dtf-shell--center">
        <p className="dtf-loading">Redirection vers le paiement sécurisé…</p>
        <DonationTypeformStyles />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="dtf-shell dtf-shell--center">
        <div className="dtf-cover">
          {campaign && <span className="dtf-cover__badge">{campaign.category || "Collecte"}</span>}
          <h1 className="dtf-cover__title">
            {campaign ? `Faire un don pour : ${campaign.title}` : "Faire un don libre à AMP BENIN"}
          </h1>
          {campaign?.shortDescription && <p className="dtf-cover__desc">{campaign.shortDescription}</p>}
          {!campaign && (
            <p className="dtf-cover__desc">
              Chaque don, quel que soit son montant, aide AMP BENIN à mobiliser la jeunesse, défendre les droits
              des femmes et agir pour un Bénin plus durable.
            </p>
          )}
          <button type="button" className="dtf-btn dtf-btn--primary dtf-btn--lg" onClick={() => setStarted(true)}>
            Commencer →
          </button>
          <a href={backHref} className="dtf-link">← Retour</a>
        </div>
        <DonationTypeformStyles />
      </div>
    );
  }

  const progressPercent = totalSteps === 0 ? 100 : Math.min(100, (currentIndex / totalSteps) * 100);

  return (
    <div className="dtf-shell">
      <div className="dtf-progress"><div className="dtf-progress__bar" style={{ width: `${progressPercent}%` }} /></div>

      <div className="dtf-topbar">
        <span className="dtf-topbar__count">{isReview ? "Dernière étape" : `Question ${currentIndex + 1} / ${totalSteps}`}</span>
        <a href={backHref} className="dtf-topbar__quit">✕ Quitter</a>
      </div>

      <div className="dtf-stage">
        <div key={currentIndex} className={`dtf-question dtf-question--${direction}`}>
          {isReview ? (
            <div className="dtf-review">
              <h1 className="dtf-question__title">Tout est prêt !</h1>
              <dl className="dtf-review__facts">
                <dt>Montant</dt>
                <dd>{Number(answers.amount).toLocaleString("fr-FR")} FCFA</dd>
                {selectedCountry && (<><dt>Pays</dt><dd>{selectedCountry.name}</dd></>)}
                {selectedProvider === "sebpay" && selectedOperatorObj && (
                  <><dt>Opérateur</dt><dd>{selectedOperatorObj.name}</dd></>
                )}
                {selectedProvider === "sebpay" && answers.phone && (
                  <><dt>Téléphone</dt><dd>{answers.phone}</dd></>
                )}
                <dt>Don anonyme</dt>
                <dd>{answers.anonymous ? "Oui" : "Non"}</dd>
                {!answers.anonymous && answers.nom && (<><dt>Nom</dt><dd>{answers.nom}</dd></>)}
                {!answers.anonymous && answers.email && (<><dt>Email</dt><dd>{answers.email}</dd></>)}
                {!answers.anonymous && !selectedCountry && answers.pays && (<><dt>Pays</dt><dd>{answers.pays}</dd></>)}
                {answers.message && (<><dt>Message</dt><dd>{answers.message}</dd></>)}
              </dl>
              {submitError && <p className="dtf-error" role="alert">{submitError}</p>}
              <div className="dtf-nav dtf-nav--review">
                <button type="button" className="dtf-btn dtf-btn--ghost" onClick={goPrev}>← Modifier</button>
                <button type="button" className="dtf-btn dtf-btn--primary dtf-btn--lg" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Redirection..." : "Faire mon don →"}
                </button>
              </div>
              <p className="dtf-note">
                {selectedProvider === "sebpay"
                  ? "Vous recevrez une demande de confirmation sur votre téléphone (mobile money)."
                  : "Vous serez redirigé·e vers notre partenaire de paiement sécurisé (FedaPay)."}
              </p>
            </div>
          ) : (
            <form
              className="dtf-form"
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
            >
              <h1 className="dtf-question__title">{currentStep.label}</h1>
              {currentStep.hint && <p className="dtf-question__hint">{currentStep.hint}</p>}

              {currentStep.type === "AMOUNT" && (
                <>
                  <div className="dtf-quick">
                    {QUICK_AMOUNTS.map((qa) => (
                      <button
                        type="button"
                        key={qa}
                        className={`dtf-quick__btn ${Number(answers.amount) === qa ? "dtf-quick__btn--active" : ""}`}
                        onClick={() => setValue(String(qa))}
                      >
                        {qa.toLocaleString("fr-FR")}
                      </button>
                    ))}
                  </div>
                  <input
                    ref={inputRef}
                    className="dtf-input"
                    type="number"
                    inputMode="numeric"
                    min={minAmount}
                    placeholder={`Autre montant (min. ${minAmount.toLocaleString("fr-FR")} FCFA)`}
                    value={answers.amount || ""}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <span className="dtf-suffix">FCFA</span>
                </>
              )}

              {currentStep.type === "COUNTRY" && (
                <div className="dtf-choices dtf-choices--scroll">
                  {countries.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      className={`dtf-choice ${answers.country === c.code ? "dtf-choice--selected" : ""}`}
                      onClick={() => {
                        // Change de pays réinitialise les réponses liées au
                        // paiement précédent (opérateur/téléphone/otp), qui
                        // ne sont plus forcément valides pour le nouveau pays.
                        setAnswers((prev) => ({ ...prev, country: c.code, operator: undefined, phone: undefined, otpCode: undefined }));
                        setStepError("");
                        setDirection("forward");
                        setTimeout(() => setCurrentIndex((i) => i + 1), 260);
                      }}
                    >
                      <span className="dtf-choice__label">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStep.type === "OPERATOR" && (
                <>
                  {operatorsLoading ? (
                    <p className="dtf-question__hint">Chargement des opérateurs disponibles...</p>
                  ) : operatorsError ? (
                    <div>
                      <p className="dtf-error" role="alert">{operatorsError}</p>
                      {sebpayCountryNames && sebpayCountryNames.length > 0 && (
                        <p className="dtf-question__hint">
                          Pays actuellement disponibles : {sebpayCountryNames.join(", ")}
                        </p>
                      )}
                      <button type="button" className="dtf-btn dtf-btn--ghost" style={{ marginTop: "var(--sp-4)" }} onClick={goPrev}>
                        ← Choisir un autre pays
                      </button>
                    </div>
                  ) : (
                    <div className="dtf-choices dtf-choices--scroll">
                      {operators.map((op) => (
                        <button
                          type="button"
                          key={op.slug}
                          className={`dtf-choice ${answers.operator === op.slug ? "dtf-choice--selected" : ""}`}
                          onClick={() => selectChoice(op.slug)}
                        >
                          <span className="dtf-choice__label">{op.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {currentStep.type === "PHONE" && (
                <input
                  ref={inputRef}
                  className="dtf-input"
                  type="tel"
                  inputMode="tel"
                  placeholder="Ex : 90000000"
                  value={answers.phone || ""}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}

              {currentStep.type === "CHOICE" && (
                <div className="dtf-choices">
                  <button
                    type="button"
                    className={`dtf-choice ${answers[currentStep.id] === true ? "dtf-choice--selected" : ""}`}
                    onClick={() => selectChoice(true)}
                  >
                    <span className="dtf-choice__badge">A</span>
                    <span className="dtf-choice__label">Oui, restez anonyme</span>
                  </button>
                  <button
                    type="button"
                    className={`dtf-choice ${answers[currentStep.id] === false ? "dtf-choice--selected" : ""}`}
                    onClick={() => selectChoice(false)}
                  >
                    <span className="dtf-choice__badge">B</span>
                    <span className="dtf-choice__label">Non, indiquer mes informations</span>
                  </button>
                </div>
              )}

              {currentStep.type === "TEXTAREA" && (
                <textarea
                  ref={inputRef}
                  className="dtf-textarea"
                  rows={4}
                  placeholder="Tapez votre réponse ici..."
                  value={answers[currentStep.id] || ""}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      goNext();
                    }
                  }}
                />
              )}

              {["TEXT", "EMAIL"].includes(currentStep.type) && (
                <input
                  ref={inputRef}
                  className="dtf-input"
                  type={currentStep.type === "EMAIL" ? "email" : "text"}
                  placeholder="Tapez votre réponse ici..."
                  value={answers[currentStep.id] || ""}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}

              {stepError && <p className="dtf-error" role="alert">{stepError}</p>}

              <div className="dtf-nav">
                <button type="button" className="dtf-btn dtf-btn--ghost" onClick={goPrev} disabled={currentIndex === 0}>
                  ← Précédent
                </button>
                <span className="dtf-nav__spacer" />
                {currentStep.type !== "CHOICE" && <span className="dtf-nav__hint">Appuyez sur Entrée ↵</span>}
                <button type="submit" className="dtf-btn dtf-btn--primary">Suivant →</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <DonationTypeformStyles />
    </div>
  );
}

function DonationTypeformStyles() {
  // Plein écran toujours dans les couleurs de marque AMP BENIN — pas de
  // dark mode sur le site public (voir tokens.css), donc pas besoin de
  // figer en hexadécimal comme le fait VolunteerApplicationForm.jsx (qui,
  // lui, dérive une palette par programme).
  return (
    <style>{`
      .dtf-shell {
        position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
        display: flex; flex-direction: column;
        background: radial-gradient(ellipse at top right, rgba(201,144,58,0.28), transparent 55%),
                    linear-gradient(160deg, var(--col-primary-dark) 0%, var(--col-primary) 55%, var(--col-accent-dark) 140%);
        color: #FFFFFF;
        font-family: var(--font-body);
        z-index: 10;
      }
      .dtf-shell--center { align-items: center; justify-content: center; text-align: center; padding: var(--sp-8); gap: var(--sp-6); }

      .dtf-loading, .dtf-fatal { font-size: var(--text-lg); }

      .dtf-progress { height: 4px; width: 100%; background: rgba(255,255,255,0.18); flex-shrink: 0; }
      .dtf-progress__bar { height: 100%; background: var(--col-accent); transition: width var(--tr-slow); }

      .dtf-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--sp-5) var(--sp-6); flex-shrink: 0;
      }
      .dtf-topbar__count { font-size: var(--text-sm); color: rgba(255,255,255,0.8); }
      .dtf-topbar__quit { font-size: var(--text-sm); color: rgba(255,255,255,0.8); text-decoration: none; }
      .dtf-topbar__quit:hover { color: #FFFFFF; }

      .dtf-stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: var(--sp-6); }

      .dtf-question { width: 100%; max-width: 38rem; }
      .dtf-question--forward { animation: dtf-in-forward var(--tr-slow) both; }
      .dtf-question--backward { animation: dtf-in-backward var(--tr-slow) both; }
      @keyframes dtf-in-forward { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes dtf-in-backward { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }

      .dtf-question__hint { font-size: var(--text-sm); color: rgba(255,255,255,0.75); margin-bottom: var(--sp-6); }
      .dtf-question__title {
        font-family: var(--font-heading); font-weight: 500; line-height: 1.25; color: #FFFFFF;
        font-size: clamp(1.5rem, 4vw, 2.25rem); margin-bottom: var(--sp-8);
      }

      .dtf-quick { display: flex; flex-wrap: wrap; gap: var(--sp-3); margin-bottom: var(--sp-5); }
      .dtf-quick__btn {
        padding: var(--sp-3) var(--sp-5);
        border: 2px solid rgba(255,255,255,0.35);
        border-radius: var(--r-full);
        background: rgba(255,255,255,0.08);
        color: #FFFFFF;
        font-family: var(--font-body); font-weight: 600; font-size: var(--text-base);
        cursor: pointer; transition: all var(--tr-fast);
      }
      .dtf-quick__btn:hover { border-color: var(--col-accent-light); background: rgba(255,255,255,0.16); }
      .dtf-quick__btn--active { border-color: var(--col-accent); background: rgba(201,144,58,0.32); }

      .dtf-input, .dtf-textarea {
        width: 100%; background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.5);
        color: #FFFFFF; font-family: var(--font-body); font-size: var(--text-xl);
        padding: var(--sp-3) var(--sp-1); transition: border-color var(--tr-base);
      }
      .dtf-input::placeholder, .dtf-textarea::placeholder { color: rgba(255,255,255,0.45); }
      .dtf-input:focus, .dtf-textarea:focus { outline: none; border-color: var(--col-accent); }
      .dtf-textarea { resize: vertical; }
      .dtf-suffix { display: inline-block; margin-top: var(--sp-2); font-size: var(--text-sm); color: rgba(255,255,255,0.65); }

      .dtf-choices { display: flex; flex-direction: column; gap: var(--sp-3); }
      .dtf-choices--scroll { max-height: 22rem; overflow-y: auto; padding-right: var(--sp-2); }
      .dtf-choice {
        display: flex; align-items: center; gap: var(--sp-4);
        background: rgba(255,255,255,0.10); border: 2px solid rgba(255,255,255,0.28);
        border-radius: var(--r-md); padding: var(--sp-4) var(--sp-5);
        color: #FFFFFF; font-family: var(--font-body); font-size: var(--text-base);
        text-align: left; cursor: pointer; transition: all var(--tr-fast);
      }
      .dtf-choice:hover { border-color: var(--col-accent-light); background: rgba(255,255,255,0.16); transform: translateX(4px); }
      .dtf-choice--selected { border-color: var(--col-accent); background: rgba(201,144,58,0.32); }
      .dtf-choice__badge {
        display: flex; align-items: center; justify-content: center;
        width: 2rem; height: 2rem; border-radius: var(--r-sm); flex-shrink: 0;
        background: rgba(255,255,255,0.18); font-weight: 700; font-size: var(--text-sm);
      }
      .dtf-choice--selected .dtf-choice__badge { background: var(--col-accent); color: var(--col-accent-xdark); }

      .dtf-error {
        color: #FFC9C9; font-size: var(--text-sm); margin-top: var(--sp-4); font-weight: 600;
      }

      .dtf-nav { display: flex; align-items: center; flex-wrap: wrap; gap: var(--sp-3) var(--sp-4); margin-top: var(--sp-8); }
      .dtf-nav--review { justify-content: space-between; flex-wrap: wrap; }
      .dtf-nav__spacer { flex: 1; }
      .dtf-nav__hint { font-size: var(--text-xs); color: rgba(255,255,255,0.65); }

      .dtf-btn {
        display: inline-flex; align-items: center; gap: var(--sp-2);
        border-radius: var(--r-md); padding: var(--sp-3) var(--sp-6);
        font-family: var(--font-body); font-weight: 600; font-size: var(--text-base);
        cursor: pointer; border: none; transition: all var(--tr-fast); white-space: nowrap;
        text-decoration: none;
      }
      .dtf-btn--primary { background: var(--col-accent); color: var(--col-accent-xdark); box-shadow: 0 4px 24px rgba(201,144,58,0.45); }
      .dtf-btn--primary:hover { background: var(--col-accent-light); transform: translateY(-2px); }
      .dtf-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .dtf-btn--ghost { background: transparent; color: rgba(255,255,255,0.9); border: 2px solid rgba(255,255,255,0.4); }
      .dtf-btn--ghost:hover { border-color: rgba(255,255,255,0.65); color: #FFFFFF; background: rgba(255,255,255,0.06); }
      .dtf-btn--ghost:disabled { opacity: 0.35; cursor: not-allowed; }
      .dtf-btn--lg { padding: var(--sp-4) var(--sp-8); font-size: var(--text-lg); }

      .dtf-link {
        color: rgba(255,255,255,0.75); font-family: var(--font-body); font-size: var(--text-sm);
        font-weight: 600; text-decoration: underline; text-underline-offset: 3px;
      }
      .dtf-link:hover { color: #FFFFFF; }

      .dtf-cover { max-width: 34rem; display: flex; flex-direction: column; align-items: center; gap: var(--sp-5); }
      .dtf-cover__badge {
        display: inline-block; background: rgba(255,255,255,0.16); color: #FFFFFF;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: var(--r-full); padding: var(--sp-1) var(--sp-4); font-size: var(--text-sm);
        font-weight: 600;
      }
      .dtf-cover__title {
        font-family: var(--font-heading); font-weight: 500; font-size: clamp(1.75rem, 5vw, 2.75rem);
        line-height: 1.2; color: #FFFFFF;
      }
      .dtf-cover__desc { color: rgba(255,255,255,0.9); font-size: var(--text-lg); }

      .dtf-review__facts {
        display: grid; grid-template-columns: auto 1fr; gap: var(--sp-2) var(--sp-5);
        text-align: left; margin-bottom: var(--sp-6); font-size: var(--text-base);
      }
      .dtf-review__facts dt { font-weight: 700; color: rgba(255,255,255,0.75); }
      .dtf-review__facts dd { color: #FFFFFF; word-break: break-word; }
      .dtf-note { font-size: var(--text-xs); color: rgba(255,255,255,0.65); margin-top: var(--sp-5); }

      @media (max-width: 640px) {
        .dtf-topbar { padding: var(--sp-4); }
        .dtf-stage { padding: var(--sp-4); align-items: flex-start; padding-top: var(--sp-12); }
        .dtf-nav__hint { display: none; }
        .dtf-btn { padding: var(--sp-3) var(--sp-4); }
        .dtf-btn--lg { padding: var(--sp-3) var(--sp-6); }
      }

      @media (prefers-reduced-motion: reduce) {
        .dtf-question--forward, .dtf-question--backward { animation: none; }
      }
    `}</style>
  );
}
