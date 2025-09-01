// netlify/functions/fetchVolunteersForCertificate.js
import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import Mission from "./models/Mission.js";

export async function handler(event) {
  console.log("🚀 Nouvelle requête fetchVolunteersForCertificate");
  console.log("Méthode HTTP:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    console.warn("⚠️ Method Not Allowed");
    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
  }

  try {
    console.log("🔹 Connexion à MongoDB...");
    await connectDB();
    console.log("✅ Connexion Mongo réussie");
    console.log("URI utilisée:", process.env.MONGO_URI_SECOND);

    const body = event.body || "{}";
    console.log("Corps de la requête:", body);

    const { titre } = JSON.parse(body);
    if (!titre) {
      console.warn("⚠️ Titre de mission requis");
      return { statusCode: 400, body: JSON.stringify({ message: "Titre de mission requis" }) };
    }

    console.log("🔹 Recherche de la mission:", titre);
    const mission = await Mission.findOne({ titre });
    if (!mission) {
      console.warn("⚠️ Mission introuvable");
      return { statusCode: 404, body: JSON.stringify({ message: "Mission introuvable" }) };
    }
    console.log("✅ Mission trouvée:", mission._id);

    console.log("🔹 Récupération des volontaires avec statut 'Mission validée'...");
    let volunteers = await Volunteer.find({ mission: mission._id, statut: "Mission validée" }).lean();
    console.log(`✅ ${volunteers.length} volontaires trouvés avant filtrage des attestations`);

    // Filtrer ceux qui n'ont pas encore d'attestation pour cette mission
    volunteers = volunteers.filter(v => {
      const hasAttestation = v.attestations?.some(a => a.missionId.toString() === mission._id.toString());
      return !hasAttestation;
    });
    console.log(`✅ ${volunteers.length} volontaires après filtrage`);

    // Retourner infos utiles au frontend
    const response = volunteers.map(v => ({
      _id: v._id,
      nom: v.nom,
      prenom: v.prenom,
      email: v.email,
      telephone: v.telephone,
    }));

    console.log("🔹 Réponse envoyée au frontend");

    return { statusCode: 200, body: JSON.stringify({ mission: { _id: mission._id, titre: mission.titre }, volunteers: response, total: response.length }) };

  } catch (error) {
    console.error("❌ Erreur fetchVolunteersForCertificate:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message || "Erreur serveur" }) };
  }
};
