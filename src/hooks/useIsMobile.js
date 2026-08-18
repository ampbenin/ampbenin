// src/hooks/useIsMobile.js
// Détecte un écran mobile (décision utilisateur, 2026-08-18 : la table
// "Progression par volontaire" devient des cartes empilées sur mobile,
// plutôt qu'un simple défilement horizontal). matchMedia + listener plutôt
// que window.innerWidth seul, pour réagir à une rotation d'écran/un
// redimensionnement sans recharger la page.
import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
