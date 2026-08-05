import { useEffect, useState } from "react";

/**
 * Garde d'accès côté client pour le tableau de bord "Mon espace" : redirige
 * vers /mon-espace/login si aucun token stocké. Pas de notion de rôle ici
 * (contrairement à useNumsalGuard) — un seul type de compte. Le vrai
 * contrôle d'accès reste côté serveur (chaque appel volunteerFetch passe
 * par middlewares/volunteer/authMiddleware.js) ; cette garde n'est qu'un
 * raccourci UX pour ne pas afficher un tableau de bord vide/en erreur.
 */
export function useVolunteerGuard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("volunteer_token");
    if (!token) {
      window.location.href = "/mon-espace/login";
      return;
    }
    setReady(true);
  }, []);

  return ready;
}
