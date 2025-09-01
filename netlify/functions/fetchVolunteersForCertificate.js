// netlify/functions/fetchVolunteersForCertificate.js
import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import Mission from "./models/Mission.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    await connectDB();

    const { titre } = JSON.parse(event.body || "{}");
    if (!titre) {
      return { statusCode: 400, body: JSON.stringify({ message: "Titre de mission requis" }) };
    }

    // Récupérer la mission
    const mission = await Mission.findOne({ titre });
    if (!mission) {
      return { statusCode: 404, body: JSON.stringify({ message: "Mission introuvable" }) };
    }

    // Récupérer tous les volontaires avec statut "Mission validée"
    let volunteers = await Volunteer.find({ mission: mission._id, statut: "Mission validée" }).lean();

    // Filtrer ceux qui n'ont pas encore d'attestation pour cette mission
    volunteers = volunteers.filter(v => {
      const hasAttestation = v.attestations?.some(a => a.missionId.toString() === mission._id.toString());
      return !hasAttestation;
    });

    // Retourner infos utiles au frontend
    const response = volunteers.map(v => ({
      _id: v._id,
      nom: v.nom,
      prenom: v.prenom,
      email: v.email,
      telephone: v.telephone,
    }));

    return { statusCode: 200, body: JSON.stringify({ mission: { _id: mission._id, titre: mission.titre }, volunteers: response, total: response.length }) };

  } catch (error) {
    console.error("Erreur fetchVolunteersForCertificate:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
