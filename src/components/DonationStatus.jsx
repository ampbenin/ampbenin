// src/components/DonationStatus.jsx
// Page de retour après paiement (/don/status), deux origines possibles :
// 1. FedaPay redirige ici lui-même avec
//    ?status=approved&id=<transactionId>&close=<true|false>. FedaPay ne
//    renvoie ce paramètre "approved" QUE lorsque le paiement a réellement
//    abouti de leur côté — même principe de confiance immédiate que
//    VotePaymentStatus.jsx/TicketPaymentStatus.jsx sur les autres sites du
//    groupe : on affiche le succès tout de suite, SANS attendre que notre
//    propre webhook ait confirmé le don (il arrive presque toujours en
//    quelques secondes, mais peut parfois prendre bien plus longtemps — le
//    donateur n'a aucune raison d'attendre pour ça, le paiement a déjà
//    réussi). Un appel non-bloquant récupère ensuite le montant pour
//    l'afficher, mais n'empêche jamais le message de succès de s'afficher.
// 2. Pour SebPay (pas de redirection agrégateur : collecte directe), c'est
//    DonationTypeform.jsx qui navigue ici juste après l'initiation, avec
//    ?provider=sebpay&id=<transactionId> — même convention que
//    TicketPaymentStatus.jsx. Ici, contrairement à FedaPay, il n'existe pas
//    de signal "approuvé" au moment de la redirection (le donateur doit
//    encore valider sur son téléphone) : un vrai suivi par sondage reste
//    nécessaire, seul ce cas-là interroge le serveur en boucle.
import { useEffect, useRef, useState } from "react";
import { getDonationStatus } from "../services/donations/api";

// Sondage SebPay uniquement (voir commentaire ci-dessus) : deux paliers, vite
// au début puis plus lentement en arrière-plan pendant plusieurs minutes.
const FAST_INTERVAL_MS = 2500;
const FAST_ATTEMPTS = 10; // ~25s
const SLOW_INTERVAL_MS = 6000;
const SLOW_ATTEMPTS = 40; // ~4 minutes de plus

export default function DonationStatus({ status, transactionId, close, provider }) {
  // checking | mobile-pending | cancelled | paid | pending-long | failed | error
  const [phase, setPhase] = useState("checking");
  const [amount, setAmount] = useState(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (provider === "sebpay" && transactionId) {
      // Flux SebPay : pas de signal "approuvé" à la redirection, le donateur
      // doit encore valider sur son téléphone — un vrai sondage est ici
      // nécessaire (voir poll() ci-dessous).
      setPhase("mobile-pending");

      const poll = async () => {
        try {
          const data = await getDonationStatus(transactionId);
          if (data?.status === "paid") {
            setAmount(data.montant ?? null);
            setPhase("paid");
            return;
          }
          if (data?.status === "failed") {
            setPhase("failed");
            return;
          }
          attemptsRef.current += 1;
          const attempt = attemptsRef.current;

          if (attempt === FAST_ATTEMPTS) {
            setPhase("pending-long");
          }
          if (attempt >= FAST_ATTEMPTS + SLOW_ATTEMPTS) {
            return;
          }

          const interval = attempt < FAST_ATTEMPTS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
          timerRef.current = setTimeout(poll, interval);
        } catch {
          setPhase("error");
        }
      };

      poll();
      return;
    }

    if (close === "true") {
      setPhase("cancelled");
      return;
    }
    if (status !== "approved" || !transactionId) {
      setPhase("error");
      return;
    }

    // Flux FedaPay : succès affiché immédiatement (voir commentaire en tête
    // de fichier) — le montant est récupéré à part, en best-effort, sans
    // jamais retarder ni conditionner l'affichage du message de succès.
    setPhase("paid");
    getDonationStatus(transactionId)
      .then((data) => setAmount(data?.montant ?? null))
      .catch(() => {});
  }, [status, transactionId, close, provider]);

  return (
    <div className="don-card don-card--center">
      {phase === "checking" && (
        <>
          <p className="don-spinner" aria-hidden="true" />
          <p className="don-status__text">Vérification de votre paiement…</p>
        </>
      )}

      {phase === "mobile-pending" && (
        <>
          <p className="don-spinner" aria-hidden="true" />
          <h1 className="don-status__title">Confirmez sur votre téléphone</h1>
          <p className="don-status__text">
            Une demande de paiement a été envoyée à votre numéro. Validez-la (notification ou code USSD reçu) pour
            confirmer votre don — cette page se met à jour automatiquement dès la confirmation.
          </p>
        </>
      )}

      {phase === "cancelled" && (
        <>
          <h1 className="don-status__title">Don annulé</h1>
          <p className="don-status__text">
            Vous avez annulé le paiement. Aucun montant n'a été prélevé — vous pouvez réessayer quand vous le souhaitez.
          </p>
          <a href="/don" className="btn btn--primary">Réessayer</a>
        </>
      )}

      {phase === "paid" && (
        <>
          <h1 className="don-status__title don-status__title--success">Merci pour votre don ! 💚</h1>
          <p className="don-status__text">
            {amount
              ? <>Votre don de <strong>{Number(amount).toLocaleString("fr-FR")} FCFA</strong> a bien été reçu.</>
              : "Votre don a bien été reçu."}
            {" "}Il contribue directement aux actions d'AMP BENIN au Bénin.
          </p>
          <a href="/" className="btn btn--primary">Retour à l'accueil</a>
        </>
      )}

      {phase === "pending-long" && (
        <>
          <p className="don-spinner don-spinner--sm" aria-hidden="true" />
          <h1 className="don-status__title">Confirmation en cours</h1>
          <p className="don-status__text">
            Votre paiement est en cours de confirmation — cela peut prendre quelques minutes.
            Cette page vérifie automatiquement et affichera la confirmation dès qu'elle arrive ;
            vous pouvez aussi la laisser ouverte ou revenir plus tard, pas besoin de réessayer le paiement.
          </p>
          <a href="/" className="btn btn--primary">Retour à l'accueil</a>
        </>
      )}

      {phase === "failed" && (
        <>
          <h1 className="don-status__title don-status__title--error">Le paiement a échoué</h1>
          <p className="don-status__text">
            Votre don n'a pas pu être finalisé. Aucun montant n'a été prélevé — vous pouvez réessayer.
          </p>
          <a href="/don" className="btn btn--primary">Réessayer</a>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="don-status__title don-status__title--error">Une erreur est survenue</h1>
          <p className="don-status__text">
            Nous n'avons pas pu confirmer le statut de votre don. Si un montant a été prélevé et que vous ne recevez
            pas de confirmation, contactez-nous.
          </p>
          <div className="don-status__actions">
            <a href="/don" className="btn btn--primary">Réessayer</a>
            <a href="/contact" className="btn btn--ghost">Nous contacter</a>
          </div>
        </>
      )}

      <DonationStatusStyles />
    </div>
  );
}

function DonationStatusStyles() {
  return (
    <style>{`
      .don-card {
        max-width: 32rem;
        margin-inline: auto;
        background: var(--col-white);
        border: 1px solid var(--col-border-light);
        border-radius: var(--r-xl);
        box-shadow: var(--sh-md);
        padding: var(--sp-10) var(--sp-8);
        display: flex;
        flex-direction: column;
        gap: var(--sp-5);
      }
      .don-card--center { align-items: center; text-align: center; }

      .don-spinner {
        width: 2.5rem; height: 2.5rem;
        border: 3px solid var(--col-border);
        border-top-color: var(--col-primary);
        border-radius: 50%;
        animation: don-spin 0.8s linear infinite;
      }
      .don-spinner--sm { width: 1.75rem; height: 1.75rem; border-width: 2.5px; }
      @keyframes don-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .don-spinner { animation: none; }
      }

      .don-status__title { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-2xl); color: var(--col-text); }
      .don-status__title--success { color: var(--col-primary); }
      .don-status__title--error { color: var(--col-error); }
      .don-status__text { color: var(--col-text-sec); font-size: var(--text-base); line-height: 1.6; }
      .don-status__actions { display: flex; flex-wrap: wrap; gap: var(--sp-4); justify-content: center; }
    `}</style>
  );
}
