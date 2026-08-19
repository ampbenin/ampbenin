import { useEffect, useState } from "react";

// Ne s'affiche que si un token existe réellement (décision utilisateur,
// 2026-08-19 : "il y a bouton connexion et deconnexion et les deux font
// les meme choses quand on est connecté. Il faut un seul.") — avant ce
// correctif, ce bouton était toujours rendu par défaut (slot "logout" de
// GestionAMPLayout.astro), y compris quand amp-nav affichait déjà un lien
// "Connexion" pour un rôle non reconnu. Vérifié au montage uniquement
// (localStorage n'est pas accessible côté serveur Astro) : un léger flash
// possible avant hydratation, sans conséquence ici (aucune mise en page
// ne dépend de la présence de ce bouton).
export default function LogoutButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("amp_token"));
  }, []);

  if (!loggedIn) return null;

  const logout = () => {
    localStorage.removeItem("amp_token");
    window.location.href = "/gestionamp/login";
  };

  return (
    <button onClick={logout}>
      Déconnexion
    </button>
  );
}
