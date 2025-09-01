import { connectDB } from "./mongo.js";
import Mission from "./models/Mission.js";
import Volunteer from "./models/Volunteer.js";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export async function handler(event) {
  console.log("📩 saveVolunteers function appelée");
  console.log("Méthode HTTP:", event.httpMethod);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };
  }

  try {
    await connectDB();
    console.log("✅ Connecté à MongoDB");

    const { titre, nom, prenom, email, telephone, statut } = JSON.parse(event.body || "{}");
    console.log("📦 Body parsé:", { titre, nom, prenom, email, telephone, statut });

    // validations
    if (!titre) return { statusCode: 400, headers, body: JSON.stringify({ message: "Le titre de la mission est requis" }) };
    if (!nom || !prenom || !email) return { statusCode: 400, headers, body: JSON.stringify({ message: "Champs requis: nom, prenom, email" }) };

    const mission = await Mission.findOne({ titre }).lean();
    if (!mission) return { statusCode: 404, headers, body: JSON.stringify({ message: "Mission introuvable pour ce titre" }) };

    const volunteer = await Volunteer.create({
      nom,
      prenom,
      email: email.trim().toLowerCase(),
      telephone,
      mission: mission._id,
      statut: statut || undefined, // si statut non fourni, Mongoose prendra la valeur par défaut
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: "Volontaire enregistré avec succès", volunteer }),
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: "Ce volontaire est déjà inscrit à cette mission (email déjà utilisé)." }),
      };
    }
    console.error("💥 Erreur saveVolunteers:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
