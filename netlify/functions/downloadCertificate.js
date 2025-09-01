// netlify/functions/downloadCertificate.js
import { connectDB } from "./mongo.js"; // connexion MongoDB
import Volunteer from "./models/Volunteer.js"; // modèle Volunteer
import cloudinary from "./cloudinary.js"; // config Cloudinary

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  try {
    await connectDB();

    const { email, nom, missionId } = JSON.parse(event.body || "{}");

    if (!email || !nom) {
      return { statusCode: 400, body: JSON.stringify({ message: "Email et nom sont requis" }) };
    }

    // Vérifier l'existence du volontaire
    const volunteer = await Volunteer.findOne({ email });

    if (!volunteer) {
      return { statusCode: 404, body: JSON.stringify({ message: "Volontaire non enregistré" }) };
    }

    if (volunteer.nom !== nom) {
      return { statusCode: 400, body: JSON.stringify({ message: "Nom incorrect" }) };
    }

    // Si aucune mission n'est sélectionnée, renvoyer la liste
    if (!missionId) {
      const missions = volunteer.attestations.map(a => ({
        missionId: a.missionId,
        missionName: a.missionName || "Nom mission non défini"
      }));
      return { statusCode: 200, body: JSON.stringify({ missions }) };
    }

    // Sinon, mission choisie : vérifier statut et renvoyer le lien Cloudinary
    const cert = volunteer.attestations.find(a => a.missionId.toString() === missionId);

    if (!cert) {
      return { statusCode: 404, body: JSON.stringify({ message: "Attestation non trouvée pour cette mission" }) };
    }

    if (cert.statut === "Non disponible") {
      return { statusCode: 403, body: JSON.stringify({ message: "Attestation non disponible" }) };
    }

    if (cert.statut === "Refusé") {
      return { statusCode: 403, body: JSON.stringify({ message: "Attestation refusée" }) };
    }

    if (cert.statut === "Mission validée") {
      // Récupérer le lien Cloudinary
      const fileUrl = cert.fileUrl;

      if (!fileUrl) {
        return { statusCode: 500, body: JSON.stringify({ message: "Lien de l'attestation manquant" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ url: fileUrl }) };
    }

    // Cas improbable
    return { statusCode: 400, body: JSON.stringify({ message: "Statut inconnu" }) };

  } catch (error) {
    console.error("Erreur downloadCertificate:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Erreur serveur" }) };
  }
}
