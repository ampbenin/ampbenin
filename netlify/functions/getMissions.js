import { connectDB } from "./mongo.js";
import Mission from "./models/Mission.js";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "GET")
    return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };

  try {
    await connectDB();
    const missions = await Mission.find().sort({ dateDebut: -1 }).lean();
    return { statusCode: 200, headers, body: JSON.stringify(missions) };
  } catch (error) {
    console.error("getMissions error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
