import React, { useState, useEffect } from "react";

const STATUTS = ["Non disponible", "Refusé", "Mission validée"];

export default function SaveVolunteers() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    missions: [], // { missionId, statut }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [allMissions, setAllMissions] = useState([]);
  const [assignedMissions, setAssignedMissions] = useState([]);
  const [volunteerId, setVolunteerId] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ===================== FETCH MISSIONS ===================== */
  useEffect(() => {
    fetch("https://potential-rafa-amp1-00541efa.koyeb.app/api/missions")
      .then((res) => res.json())
      .then(setAllMissions)
      .catch(console.error);
  }, []);

  /* ===================== AUTOCOMPLETE EMAIL ===================== */
  useEffect(() => {
    if (email.length < 2) return;

    const delay = setTimeout(async () => {
      const res = await fetch(
        `https://potential-rafa-amp1-00541efa.koyeb.app/api/volunteers?search=${email}`
      );
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.items);
        setShowSuggestions(true);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [email]);

  /* ===================== SELECT VOLUNTEER ===================== */
  const handleSelectVolunteer = (volunteer) => {
    setEmail(volunteer.email);
    setVolunteerId(volunteer._id);

    setForm({
      nom: volunteer.nom || "",
      prenom: volunteer.prenom || "",
      telephone: volunteer.telephone || "",
      missions: [],
    });

    setAssignedMissions(volunteer.missions || []);
    setShowSuggestions(false);
  };

  /* ===================== MISSIONS ===================== */
  const toggleMission = (missionId) => {
    setForm((prev) => {
      const exists = prev.missions.find((m) => m.missionId === missionId);
      if (exists) {
        return {
          ...prev,
          missions: prev.missions.filter((m) => m.missionId !== missionId),
        };
      }
      return {
        ...prev,
        missions: [...prev.missions, { missionId, statut: "Non disponible" }],
      };
    });
  };

  const updateMissionStatut = (missionId, statut) => {
    setForm((prev) => ({
      ...prev,
      missions: prev.missions.map((m) =>
        m.missionId === missionId ? { ...m, statut } : m
      ),
    }));
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email,
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        missions: form.missions,
      };

      const res = await fetch("https://potential-rafa-amp1-00541efa.koyeb.app/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur lors de l’enregistrement");

      setMessage({
        type: "success",
        text: volunteerId
          ? "Volontaire mis à jour"
          : "Volontaire créé avec succès",
      });

      setEmail("");
      setForm({ nom: "", prenom: "", telephone: "", missions: [] });
      setAssignedMissions([]);
      setVolunteerId(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        Ajouter / Mettre à jour un volontaire
      </h2>

      {message && (
        <p
          className={`text-center mb-4 ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* EMAIL */}
        <div className="relative">
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setAssignedMissions([]);
              setVolunteerId(null);
            }}
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded-xl"
            required
          />

          {showSuggestions && (
            <ul className="absolute w-full bg-white border rounded-xl shadow">
              {suggestions.map((v) => (
                <li
                  key={v._id}
                  onClick={() => handleSelectVolunteer(v)}
                  className="p-2 cursor-pointer hover:bg-yellow-100"
                >
                  {v.email}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          placeholder="Nom"
          className="w-full border p-3 rounded-xl"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
        />
        <input
          placeholder="Prénom"
          className="w-full border p-3 rounded-xl"
          value={form.prenom}
          onChange={(e) => setForm({ ...form, prenom: e.target.value })}
        />
        <input
          placeholder="Téléphone"
          className="w-full border p-3 rounded-xl"
          value={form.telephone}
          onChange={(e) => setForm({ ...form, telephone: e.target.value })}
        />

        {/* TABLE MISSIONS */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Mission</th>
              <th className="border p-2">Statut de la mission</th>
            </tr>
          </thead>
          <tbody>
            {allMissions.map((mission) => {
              const assigned = assignedMissions.find(
                (m) => m.missionId?._id === mission._id
              );
              const selected = form.missions.find(
                (m) => m.missionId === mission._id
              );

              return (
                <tr key={mission._id}>
                  <td className="border p-2">
                    <input
                      type="checkbox"
                      disabled={!!assigned}
                      checked={!!selected}
                      onChange={() => toggleMission(mission._id)}
                    />{" "}
                    {mission.titre}
                  </td>
                  <td className="border p-2">
                    {assigned ? (
                      <span className="font-semibold">
                        {assigned.statut}
                      </span>
                    ) : selected ? (
                      <select
                        value={selected.statut}
                        onChange={(e) =>
                          updateMissionStatut(
                            mission._id,
                            e.target.value
                          )
                        }
                        className="border rounded p-1"
                      >
                        {STATUTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          disabled={loading}
          className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
