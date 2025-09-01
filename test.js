// addMission.js
// test.js
import mongoose from "mongoose";
import Mission from "./netlify/functions/models/Mission.js"; // chemin vers ton modèle
import { connectDB } from "./netlify/functions/mongo.js"; // connexion DB
import dotenv from "dotenv";
dotenv.config();

async function addMission() {
  try {
    console.log("🔌 Connexion à MongoDB...");
    await connectDB();
    console.log("✅ Connecté à la base !");

    // Crée une nouvelle mission
    const missionData = {
      titre: "MyCountry229_08_2025",
      description: "Mission de sensibilisation pour la paix et la cohésion sociale",
      startDate: new Date("2025-08-11"),
      endDate: new Date("2025-08-24"),
      location: "Bénin",
      // ajoute d'autres champs nécessaires selon ton modèle Mission
    };

    const mission = await Mission.create(missionData);
    console.log("👤 Mission créée avec succès :", mission);

    process.exit(0);
  } catch (error) {
    console.error("💥 Erreur lors de la création de la mission :", error);
    process.exit(1);
  }
}

addMission();
