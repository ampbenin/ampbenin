// Client API pour l'espace volontaire public ("Mon espace"). Token dédié
// (volunteer_token), jamais amp_token (réservé au staff admin) — pour ne
// jamais mélanger une session staff et une session volontaire dans le
// même navigateur. Calqué sur services/gestionamp/api.js.
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || "";

export const volunteerFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("volunteer_token");
  const { params, headers, ...fetchOptions } = options;

  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const url = `${API_BASE_URL}/api${endpoint}${queryString}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("volunteer_token");
    window.location.href = "/mon-espace/login";
    return;
  }

  const contentType = response.headers.get("content-type");
  const data = contentType && contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "Erreur API");
  }

  return data;
};
