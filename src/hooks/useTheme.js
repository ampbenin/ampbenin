// src/hooks/useTheme.js
// Mode sombre/clair — décision utilisateur, 2026-08-18 : "uniquement
// Volontaire/Superviseur", jamais le reste du site (public ni Admin). Une
// seule clé localStorage partagée entre les 3 pages concernées
// (Dashboard.jsx, ProgramProgress.jsx, SupervisorDashboard.jsx) — c'est une
// préférence d'appareil/navigateur, pas un réglage de compte, donc pas de
// champ côté serveur. Par défaut, suit prefers-color-scheme tant que
// l'utilisateur n'a jamais choisi manuellement (décision utilisateur).
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

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return { theme, toggleTheme };
}
