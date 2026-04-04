const API_BASE_URL = import.meta.env.PUBLIC_API_URL;

/**
 * Construit une query string propre
 */
const buildQueryParams = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Client API centralisé - AMP BENIN
 * ⚠️ Tous les endpoints sont SANS /api
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("amp_token");

  const { params, headers, ...fetchOptions } = options;

  const queryString = buildQueryParams(params);

  // ✅ /api CENTRALISÉ ICI
  const url = `${API_BASE_URL}/api${endpoint}${queryString}`;

  console.log("📡 API CALL →", url);

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  // 🔐 sécurité : token invalide
  if (response.status === 401) {
    localStorage.removeItem("amp_token");
    window.location.href = "/gestionamp/login";
    return;
  }

  // 🔍 protection HTML / erreurs serveur
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Réponse API invalide (non JSON)");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur API");
  }

  return data;
};
