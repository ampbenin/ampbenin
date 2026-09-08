// Client pour l'API de dons AMP BENIN. Backend externe, indépendant de
// server-amp-sites (PUBLIC_API_BASE) : le paiement (FedaPay) et
// l'enregistrement des dons sont intégralement gérés là-bas, ce module ne
// fait qu'appeler cette API — voir server-miss-culture-benin, namespace
// /api/amp-benin. Aucune donnée de donateur ne doit transiter ailleurs.
const DONATIONS_API_BASE =
  import.meta.env.PUBLIC_DONATIONS_API_BASE ||
  "https://server-miss-culture-benin-production.up.railway.app/api/amp-benin";

async function request(path, options = {}) {
  const res = await fetch(`${DONATIONS_API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Erreur lors de la communication avec le serveur de dons.");
  }
  return data;
}

// { donationsEnabled, donationMinAmount, ... }
export const getDonationSettings = () => request("/settings/voting-period");

// payload: { montant, anonymous, donor?, message? } → { payment_url }
export const createDonation = (payload) =>
  request("/donations", { method: "POST", body: JSON.stringify(payload) });

// { status: "pending"|"paid"|"failed", provider, montant }
export const getDonationStatus = (transactionId) =>
  request(`/donations/status/${transactionId}`);
