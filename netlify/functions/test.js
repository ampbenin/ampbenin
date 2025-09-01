// netlify/functions/seedAdmin.js
import { connectDB } from "./mongo.js";
import Admin from "./models/Admin.js";
import bcrypt from "bcryptjs";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  try {
    await connectDB();

    // Les infos de l'admin à créer
    const username = "del.HCS";          // modifie si besoin
    const password = "President61"; // mot de passe clair
    const role = "CadreA";            // CadreA / CadreB / CadreC

    // Vérifier si l'admin existe déjà
    const existing = await Admin.findOne({ username });
    if (existing) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Admin déjà présent dans la base" }),
      };
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ username, password: hashedPassword, role });
    await newAdmin.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Admin créé avec succès !", username, role }),
    };
  } catch (err) {
    console.error("❌ Erreur seedAdmin:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur : " + err.message }),
    };
  }
}
