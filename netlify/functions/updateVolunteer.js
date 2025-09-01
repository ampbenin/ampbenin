import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import mongoose from "mongoose";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "PUT") return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };

  try {
    await connectDB();
    const { id, statut, certificatePath } = JSON.parse(event.body || "{}");

    if (!id || !mongoose.isValidObjectId(id)) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: "id invalide ou manquant" }) };
    }

    const update = {};
    if (statut) update.statut = statut;
    if (certificatePath) update.certificatePath = certificatePath;

    const res = await Volunteer.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!res) return { statusCode: 404, headers, body: JSON.stringify({ message: "Volontaire introuvable" }) };

    return { statusCode: 200, headers, body: JSON.stringify({ message: "Mis à jour", volunteer: res }) };
  } catch (error) {
    console.error("updateVolunteer error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
