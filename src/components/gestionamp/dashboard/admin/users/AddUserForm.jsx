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
  // Compte tout juste créé — affiche un bandeau avec le bouton d'invitation
  // (retour utilisateur, 2026-09-30 : "lors de la création il faut un
  // bouton envoyer de mail... le mail va contenir un bouton qui va lui
  // permettre de se connecter"). Réutilise le même endpoint que le bouton
  // "✉️ Inviter" de UsersTable.jsx (utile aussi pour un compte existant).
  const [justCreated, setJustCreated] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(false);

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

    if (role === "ADMIN" && !confirm("Créer un compte ADMIN ? Ce rôle a accès à tout le système.")) {
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/users", {
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

      setJustCreated(data.user);

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

  const sendInvite = async () => {
    if (!justCreated) return;
    setSendingInvite(true);
    try {
      const data = await apiFetch(`/users/${justCreated.id}/send-invite`, { method: "POST" });
      alert(data.message);
    } catch (error) {
      alert(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="add-user-form">
      <h3>Créer un utilisateur</h3>

      {justCreated && (
        <div style={{ background: "#EFF6E9", border: "1px solid #1B4332", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px" }}>
            Compte créé pour <strong>{justCreated.name}</strong> ({justCreated.email}).
          </p>
          <button type="button" onClick={sendInvite} disabled={sendingInvite}>
            {sendingInvite ? "Envoi..." : "✉️ Envoyer un email d'invitation"}
          </button>
          <button type="button" onClick={() => setJustCreated(null)} style={{ marginLeft: 8 }}>
            Fermer
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Rôle
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">Administrateur (ADMIN)</option>
            <option value="EC">Émissaire Communautaire (EC)</option>
            <option value="IS">Institution Spécialisée (IS)</option>
            <option value="EDITOR">Éditeur de contenu (EDITOR)</option>
            <option value="SUPERVISEUR">Superviseur (suivi des tâches)</option>
            <option value="PARTENAIRE">Partenaire (statistiques/impact)</option>
          </select>
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
            Si l'email existe déjà, le compte est simplement renommé avec ce rôle (pas de doublon) — sauf s'il
            s'agit d'un compte ADMIN. L'affectation à un programme (superviseur : quels volontaires ; partenaire :
            quels programmes) se fait ensuite depuis la fiche du programme concerné.
          </p>
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
