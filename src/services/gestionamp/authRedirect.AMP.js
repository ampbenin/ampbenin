/**
 * AMP BENIN
 * Redirection automatique après authentification selon le rôle
 *
 * @param {Object} user - utilisateur authentifié
 * @param {string} user.role - ADMIN | EC | IS
 */

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
