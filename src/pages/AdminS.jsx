// src/components/Admin.jsx
import { useState, useEffect } from "react";

// Durée d'inactivité avant demande de mot de passe (ms)
const TIMEOUT = 10 * 60 * 1000; // 10 minutes

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [missions, setMissions] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [message, setMessage] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());

  const ADMIN_PASS = import.meta.env.PUBLIC_ADMIN_PASS; // mot de passe dans .env

  // Gestion timeout
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && Date.now() - lastActivity > TIMEOUT) {
        setAuthenticated(false);
        setMessage("Session expirée. Veuillez ressaisir le mot de passe.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [authenticated, lastActivity]);

  // Mettre à jour l'activité
  const updateActivity = () => setLastActivity(Date.now());

  // Authentification
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASS) {
      setAuthenticated(true);
      setPasswordInput("");
      setMessage("Connecté !");
      fetchData();
      updateActivity();
    } else {
      setMessage("Mot de passe incorrect");
    }
  };

  // Charger missions et volontaires
  const fetchData = async () => {
    try {
      const missionsRes = await fetch("/.netlify/functions/getMissions");
      const missionsData = await missionsRes.json();
      setMissions(missionsData || []);

      const volunteersRes = await fetch("/.netlify/functions/getVolunteers");
      const volunteersData = await volunteersRes.json();
      setVolunteers(volunteersData || []);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors du chargement des données.");
    }
  };

  // Ajouter mission
  const addMission = async () => {
    const title = prompt("Titre de la mission:");
    if (!title) return;
    const description = prompt("Description de la mission:");
    try {
      const res = await fetch("/.netlify/functions/addMission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setMessage("Mission ajoutée !");
        fetchData();
      } else {
        setMessage("Erreur lors de l'ajout de la mission.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    }
  };

  // Supprimer mission
  const deleteMission = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette mission ?")) return;
    try {
      const res = await fetch("/.netlify/functions/deleteMission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage("Mission supprimée !");
        fetchData();
      } else {
        setMessage("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    }
  };

  // Ajouter volontaire
  const addVolunteer = async () => {
    const nom = prompt("Nom:");
    const prenom = prompt("Prénom:");
    const email = prompt("Email:");
    const missionId = prompt("ID de la mission (ou laisser vide):");
    try {
      const res = await fetch("/.netlify/functions/addVolunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, email, missionId }),
      });
      if (res.ok) {
        setMessage("Volontaire ajouté !");
        fetchData();
      } else {
        setMessage("Erreur lors de l'ajout du volontaire.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    }
  };

  // Bloquer/Débloquer volontaire
  const toggleVolunteer = async (id) => {
    try {
      const res = await fetch("/.netlify/functions/toggleVolunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage("Volontaire mis à jour !");
        fetchData();
      } else {
        setMessage("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    }
  };

  // Supprimer volontaire
  const deleteVolunteer = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce volontaire ?")) return;
    try {
      const res = await fetch("/.netlify/functions/deleteVolunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage("Volontaire supprimé !");
        fetchData();
      } else {
        setMessage("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h2 className="text-2xl mb-4">Connexion Admin</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-3 border rounded-lg"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button type="submit" className="w-full bg-primary text-white p-3 rounded-lg">
            Se connecter
          </button>
        </form>
        {message && <p className="mt-4 text-red-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-8" onMouseMove={updateActivity} onKeyDown={updateActivity}>
      <h2 className="text-3xl font-bold">Tableau de bord Admin Missions</h2>
      {message && <p className="text-green-600">{message}</p>}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addMission}>
          Ajouter Mission
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addVolunteer}>
          Ajouter Volontaire
        </button>
      </div>

      {/* Liste missions */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-2">Missions</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Titre</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m._id}>
                <td className="border px-2 py-1">{m.title}</td>
                <td className="border px-2 py-1">{m.description}</td>
                <td className="border px-2 py-1">
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => deleteMission(m._id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Liste volontaires */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-2">Volontaires</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Nom</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Mission</th>
              <th className="border px-2 py-1">Statut</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((v) => (
              <tr key={v._id}>
                <td className="border px-2 py-1">{v.nom} {v.prenom}</td>
                <td className="border px-2 py-1">{v.email}</td>
                <td className="border px-2 py-1">{v.missionName || "Non assigné"}</td>
                <td className="border px-2 py-1">{v.statut}</td>
                <td className="border px-2 py-1 flex gap-2">
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => toggleVolunteer(v._id)}>
                    {v.statut === "Mission validée" ? "Bloquer" : "Débloquer"}
                  </button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => deleteVolunteer(v._id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
