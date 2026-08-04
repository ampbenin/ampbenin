import React, { useState, useEffect } from "react";
import { adminFetch } from "@/services/admin/api";

const STATUTS = ["Non disponible", "Refusé", "Mission validée"];

export default function SaveVolunteers() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    programs: [], // { programId, statut }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [allPrograms, setAllPrograms] = useState([]);
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [volunteerId, setVolunteerId] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ===================== FETCH PROGRAMMES ===================== */
  useEffect(() => {
    adminFetch("/api/volunteer-programs/all")
      .then((data) => setAllPrograms(data?.items || []))
      .catch(console.error);
  }, []);

  /* ===================== AUTOCOMPLETE EMAIL ===================== */
  useEffect(() => {
    if (email.length < 2) return;

    const delay = setTimeout(async () => {
      const data = await adminFetch(`/api/volunteers?search=${encodeURIComponent(email)}`);
      if (data?.success) {
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
      programs: [],
    });

    setAssignedPrograms(volunteer.programs || []);
    setShowSuggestions(false);
  };

  /* ===================== PROGRAMMES ===================== */
  const toggleProgram = (programId) => {
    setForm((prev) => {
      const exists = prev.programs.find((p) => p.programId === programId);
      if (exists) {
        return {
          ...prev,
          programs: prev.programs.filter((p) => p.programId !== programId),
        };
      }
      return {
        ...prev,
        programs: [...prev.programs, { programId, statut: "Non disponible" }],
      };
    });
  };

  const updateProgramStatut = (programId, statut) => {
    setForm((prev) => ({
      ...prev,
      programs: prev.programs.map((p) =>
        p.programId === programId ? { ...p, statut } : p
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
        programs: form.programs,
      };

      await adminFetch("/api/volunteers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage({
        type: "success",
        text: volunteerId
          ? "Volontaire mis à jour"
          : "Volontaire créé avec succès",
      });

      setEmail("");
      setForm({ nom: "", prenom: "", telephone: "", programs: [] });
      setAssignedPrograms([]);
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
              setAssignedPrograms([]);
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

        {/* TABLE PROGRAMMES */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Programme</th>
              <th className="border p-2">Statut de la mission</th>
            </tr>
          </thead>
          <tbody>
            {allPrograms.map((program) => {
              const assigned = assignedPrograms.find(
                (p) => p.programId === program._id
              );
              const selected = form.programs.find(
                (p) => p.programId === program._id
              );

              return (
                <tr key={program._id}>
                  <td className="border p-2">
                    <input
                      type="checkbox"
                      disabled={!!assigned}
                      checked={!!selected}
                      onChange={() => toggleProgram(program._id)}
                    />{" "}
                    {program.title}
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
                          updateProgramStatut(
                            program._id,
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
