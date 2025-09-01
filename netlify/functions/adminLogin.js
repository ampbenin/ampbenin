// netlify/functions/adminLogin.js
import { connectDB } from "./mongo.js";
import Admin from "./models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function handler(event, context) {
  console.log("🔹 adminLogin invoked");
  console.log("Méthode HTTP reçue :", event.httpMethod);

  if (event.httpMethod !== "POST") {
    console.log("❌ Méthode non autorisée");
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  try {
    // Connexion à la DB
    await connectDB();
    console.log("✅ Connexion à MongoDB réussie");

    const { username, password } = JSON.parse(event.body);
    console.log("Données reçues :", { username, password });

    // Recherche de l'admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log("❌ Admin non trouvé");
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Identifiant incorrect" }),
      };
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("❌ Mot de passe incorrect");
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Mot de passe incorrect" }),
      };
    }

    // Création du token JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role, missions: admin.missions },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );
    console.log("✅ Connexion réussie, token généré");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connexion réussie",
        token,
        role: admin.role,
        missions: admin.missions,
      }),
    };
  } catch (err) {
    console.error("❌ Erreur adminLogin:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur : " + err.message }),
    };
  }
}
