import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };

  try {
    await connectDB();
    const volunteers = await Volunteer.find().populate("mission", "titre").sort({ createdAt: -1 }).lean();
    return { statusCode: 200, headers, body: JSON.stringify(volunteers) };
  } catch (error) {
    console.error("getVolunteers error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
