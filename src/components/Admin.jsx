import { useState } from "react";

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [missions, setMissions] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // notifications

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    console.log("🔹 Début handleLogin", { username, password });

    try {
      console.log("🔹 Envoi du fetch vers Netlify Function...");
      const res = await fetch("/.netlify/functions/adminLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("🔹 Fetch terminé, statut:", res.status, res.statusText);

      const text = await res.text();
      console.log("🔹 Contenu brut de la réponse:", text);

      let data;
      try {
        data = JSON.parse(text);
        console.log("🔹 JSON parsé avec succès:", data);
      } catch (err) {
        console.error("🔴 Erreur parsing JSON:", err);
        data = { message: text };
      }

      if (res.ok) {
        console.log("✅ Connexion réussie !");
        setToken(data.token);
        setRole(data.role);
        setMissions(data.missions);
        setMessage("✅ Connexion réussie !");
      } else {
        console.warn("⚠️ Erreur serveur:", data);
        setMessage(`⚠️ Erreur: ${data.message || text}`);
      }
    } catch (err) {
      console.error("🔴 Erreur fetch globale:", err);
      setMessage("🔴 Erreur serveur : " + err.message);
    } finally {
      setLoading(false);
      console.log("🔹 handleLogin terminé");
    }
  };

  if (!token) {
    return (
      <form onSubmit={handleLogin} className="p-4 border rounded w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Connexion Admin</h2>

        {message && (
          <div className={`p-2 mb-4 rounded ${message.startsWith("✅") ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
            {message}
          </div>
        )}

        <input
          type="text"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full my-2"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full my-2"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 w-full"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Bienvenue, {role}</h2>

      {role === "CadreA" && (
        <div>
          <h3 className="font-semibold">Outils complets</h3>
          <ul className="list-disc pl-6">
            <li>⚙️ Gestion des missions</li>
            <li>👤 Gestion des membres</li>
            <li>📊 Outils avancés</li>
          </ul>
        </div>
      )}

      {role === "CadreB" && (
        <div>
          <h3 className="font-semibold">Missions attribuées :</h3>
          <ul className="list-disc pl-6">
            {missions.map((m, i) => (
              <li key={i}>📌 {m}</li>
            ))}
          </ul>
        </div>
      )}

      {role === "CadreC" && (
        <div>
          <h3 className="font-semibold">Outils disponibles</h3>
          <ul className="list-disc pl-6">
            <li>➕ Ajouter un membre</li>
            <li>✏️ Modifier statut d’un membre</li>
          </ul>
        </div>
      )}
    </div>
  );
}
