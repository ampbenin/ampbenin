import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import mongoose from "mongoose";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ message: "Méthode non autorisée" }) };

  try {
    const missionId = event.queryStringParameters?.missionId;
    if (!missionId || !mongoose.isValidObjectId(missionId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: "missionId requis et valide" }) };
    }

    await connectDB();
    const volunteers = await Volunteer.find({ mission: missionId }).populate("mission", "titre").lean();
    return { statusCode: 200, headers, body: JSON.stringify(volunteers) };
  } catch (error) {
    console.error("getVolunteersByMission error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Erreur serveur", error: error.message }) };
  }
}
