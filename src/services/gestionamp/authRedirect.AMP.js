/**
 * AMP BENIN
 * Redirection automatique après authentification selon le rôle
 *
 * @param {Object} user - utilisateur authentifié
 * @param {string} user.role - ADMIN | EC | IS
 */

/**
 * Garde d'accès côté client pour les dashboards gestionamp (EC/IS et
 * maintenant SUPERVISEUR/PARTENAIRE) — redirige vers /admin/login si pas de
 * token ou rôle non autorisé pour cette page. Bug préexistant corrigé au
 * passage : ec.astro/is.astro importaient déjà `authRedirectAMP` (nom
 * différent de `redirectAfterLoginAMP` ci-dessous), qui n'existait pas —
 * leur garde d'accès échouait silencieusement à l'exécution.
 *
 * @param {string[]} allowedRoles
 */
export function authRedirectAMP(allowedRoles) {
  const token = localStorage.getItem("amp_token");
  const role = localStorage.getItem("amp_role");
  if (!token || !allowedRoles.includes(role)) {
    window.location.href = "/admin/login";
  }
}

export function redirectAfterLoginAMP(user) {
  if (!user || !user.role) {
    window.location.href = "/gestionamp/login";
    return;
  }

  switch (user.role) {
    case "ADMIN":
      window.location.href = "/gestionamp/dashboard/admin";
      break;

    case "EC":
      window.location.href = "/gestionamp/dashboard/ec";
      break;

    case "IS":
      window.location.href = "/gestionamp/dashboard/is";
      break;

    default:
      // Sécurité : rôle inconnu
      window.location.href = "/gestionamp/login";
  }
}
