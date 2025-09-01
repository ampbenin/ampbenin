import { connectDB } from "./mongo.js";
import Mission from "./models/Mission.js";

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
    const body = JSON.parse(event.body || "{}");
    const { titre, description, lieu, dateDebut, dateFin, templatePath } = body;

    if (!titre) return { statusCode: 400, headers, body: JSON.stringify({ message: "titre requis" }) };

    const mission = new Mission({ titre, description, lieu, dateDebut, dateFin });
    // si besoin, tu peux stocker mission.templatePath = templatePath;
    await mission.save();

    return { statusCode: 201, headers, body: JSON.stringify({ message: "Mission créée", mission }) };
  } catch (error) {
    console.error("saveMission error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
