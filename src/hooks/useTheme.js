// src/hooks/useTheme.js
// Mode sombre/clair — décision utilisateur, 2026-08-18 : "uniquement
// Volontaire/Superviseur", jamais le reste du site (public ni Admin). Une
// seule clé localStorage partagée entre les 3 pages concernées
// (Dashboard.jsx, ProgramProgress.jsx, SupervisorDashboard.jsx) — c'est une
// préférence d'appareil/navigateur, pas un réglage de compte, donc pas de
// champ côté serveur. Par défaut, suit prefers-color-scheme tant que
// l'utilisateur n'a jamais choisi manuellement (décision utilisateur).
//
// Signalé le 2026-08-19 : le contenu changeait bien de couleur mais pas
// l'en-tête/pied de page du site (Header.astro/Footer.astro publics,
// amp-header/amp-footer côté Superviseur) — ils vivent HORS de l'arbre
// React de ces 3 composants, dans le fichier .astro de la page. On pose
// donc aussi data-theme sur <body> (pas juste sur le conteneur React) :
// chaque page Astro a son propre <body> isolé (pas de SPA ici), donc ça ne
// fuite jamais vers les autres pages du site qui n'appellent jamais ce
// hook — mais ça permet à Header/Footer, qui utilisent déjà les mêmes
// tokens var(--col-*), de s'adapter automatiquement au thème sans code
// supplémentaire de leur côté.
import { useEffect, useState } from "react";

const STORAGE_KEY = "amp_dashboard_theme";

export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return { theme, toggleTheme };
}
