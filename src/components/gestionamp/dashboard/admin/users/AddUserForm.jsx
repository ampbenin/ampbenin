import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

/**
 * Formulaire ADMIN - Création d'un compte EC ou IS
 */
export default function AddUserForm({ onUserCreated }) {
  const [role, setRole] = useState("EC");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [coordinations, setCoordinations] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  const [coordinationId, setCoordinationId] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [loading, setLoading] = useState(false);

  /**
   * Charger les Coordinations et Institutions
   */
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const cc = await apiFetch("/coordinations");
        const is = await apiFetch("/institutions");
        setCoordinations(cc);
        setInstitutions(is);
      } catch (error) {
        console.error("Erreur chargement espaces", error);
      }
    };

    loadSpaces();
  }, []);

  /**
   * Soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role === "EC" && !coordinationId) {
      alert("Veuillez sélectionner une Coordination Communale");
      return;
    }

    if (role === "IS" && !institutionId) {
      alert("Veuillez sélectionner une Institution Spécialisée");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          coordinationCommunaleId: role === "EC" ? coordinationId : undefined,
          institutionSpecialiseeId: role === "IS" ? institutionId : undefined,
        }),
      });

      // reset
      setName("");
      setEmail("");
      setPassword("");
      setCoordinationId("");
      setInstitutionId("");

      if (onUserCreated) onUserCreated();
    } catch (error) {
      console.error("Erreur création utilisateur", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-form">
      <h3>Créer un utilisateur</h3>

      <form onSubmit={handleSubmit}>
        <label>
          Rôle
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EC">Émissaire Communautaire (EC)</option>
            <option value="IS">Institution Spécialisée (IS)</option>
          </select>
        </label>

        <label>
          Nom
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {/* Sélection dynamique de l’espace */}
        {role === "EC" && (
          <label>
            Coordination Communale
            <select
              value={coordinationId}
              onChange={(e) => setCoordinationId(e.target.value)}
              required
            >
              <option value="">-- Sélectionner --</option>
              {coordinations.map((cc) => (
                <option key={cc._id} value={cc._id}>
                  {cc.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {role === "IS" && (
          <label>
            Institution Spécialisée
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              required
            >
              <option value="">-- Sélectionner --</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer le compte"}
        </button>
      </form>
    </div>
  );
}
