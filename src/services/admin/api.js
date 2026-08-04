// Client API pour l'espace admin unifié (contenu CMS + boîte de réception)
// Réutilise le même token que gestionamp ("amp_token") car les rôles
// EDITOR/ADMIN vivent désormais dans le même modèle User.
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || "";

export const adminFetch = async (path, options = {}) => {
  const token = localStorage.getItem("amp_token");
  const { headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("amp_token");
    window.location.href = "/admin/login";
    return null;
  }

  const contentType = response.headers.get("content-type");
  const data = contentType && contentType.includes("application/json")
    ? await response.json()
    : null;

  // 🔐 mot de passe temporaire non encore changé : on redirige.
  if (response.status === 403 && data?.mustChangePassword) {
    window.location.href = "/change-password";
    return null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Erreur API");
  }

  return data;
};
