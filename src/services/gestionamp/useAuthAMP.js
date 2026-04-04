import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useAuthAMP(allowedRoles = []) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("amp_token");

      if (!token) {
        window.location.href = "/gestionamp/login";
        return;
      }

      try {
        // ✅ endpoint relatif (SANS /api)
        const data = await apiFetch("/auth/me");

        if (!data || !data.role) {
          throw new Error("Utilisateur invalide");
        }

        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(data.role)
        ) {
          window.location.href = "/gestionamp/login";
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("Erreur auth AMP :", error);
        localStorage.removeItem("amp_token");
        window.location.href = "/gestionamp/login";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
