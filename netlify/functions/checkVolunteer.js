import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };

  try {
    await connectDB();
    const { email, nom } = JSON.parse(event.body || "{}");
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ message: "email requis" }) };

    const emailNorm = email.trim().toLowerCase();
    const volunteers = await Volunteer.find({ email: emailNorm }).populate("mission", "titre").lean();

    if (!volunteers || volunteers.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ message: "Volontaire non enregistré" }) };
    }

    // Vérifier si le nom fourni correspond à au moins un enregistrement (case-insensitive)
    const matches = volunteers.filter(v => {
      if (!nom) return false;
      return v.nom && v.nom.trim().toLowerCase() === nom.trim().toLowerCase();
    });

    if (!matches || matches.length === 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ message: "Identité non confirmée" }) };
    }

    // Construire la liste des missions et statuts pour les correspondances
    const missions = matches.map(v => ({
      volunteerId: v._id,
      missionId: v.mission?._id || null,
      missionTitre: v.mission?.titre || null,
      statut: v.statut,
      certificatePath: v.certificatePath || null,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ message: "Identité confirmée", missions }) };
  } catch (error) {
    console.error("checkVolunteer error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
