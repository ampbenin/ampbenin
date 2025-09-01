import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import mongoose from "mongoose";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  // accept DELETE with body or query param id
  const id = event.httpMethod === "DELETE" && event.body ? JSON.parse(event.body).id : event.queryStringParameters?.id;
  if (!id) return { statusCode: 400, headers, body: JSON.stringify({ message: "id requis" }) };
  if (!mongoose.isValidObjectId(id)) return { statusCode: 400, headers, body: JSON.stringify({ message: "id invalide" }) };

  try {
    await connectDB();
    const res = await Volunteer.findByIdAndDelete(id);
    if (!res) return { statusCode: 404, headers, body: JSON.stringify({ message: "Volontaire introuvable" }) };
    return { statusCode: 200, headers, body: JSON.stringify({ message: "Volontaire supprimé" }) };
  } catch (error) {
    console.error("deleteVolunteer error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
