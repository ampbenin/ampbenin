// netlify/functions/saveMessage.js
import { MongoClient } from "mongodb";

let client;
let clientPromise;

// Charger la bonne URI MongoDB
const uri = process.env.MONGODB_URI;
console.log("📌 URI Mongo chargée :", uri ? "✅ Oui" : "❌ Non");

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
}

// Initialiser la connexion une seule fois
if (!clientPromise) {
  console.log("📡 Initialisation de la connexion MongoDB...");
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  clientPromise = client.connect();
}

export async function handler(event, context) {
  console.log("📥 Requête reçue :", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ result: "error", error: "Method Not Allowed" }),
    };
  }

  try {
    console.log("📦 Corps reçu :", event.body);
    const data = JSON.parse(event.body);

    console.log("🔗 Connexion à MongoDB...");
    const client = await clientPromise;
    console.log("✅ Connexion MongoDB réussie");

    console.log("📂 Sélection de la base AMPBENIN_DB_SITEWEB...");
    const db = client.db("AMPBENIN_DB_SITEWEB");

    console.log("📑 Sélection de la collection CONTACT_FORMULAIRE...");
    const collection = db.collection("CONTACT_FORMULAIRE");

    const messageDoc = {
      name: data.name || null,
      email: data.email || null,
      location: data.location || null,
      whatsapp: data.whatsapp || null,
      destination: data.destination || null,
      institution: data.institution || null,
      message: data.message || null,
      createdAt: new Date(),
    };

    console.log("📝 Document à insérer :", messageDoc);

    const result = await collection.insertOne(messageDoc);
    console.log("✅ Insertion réussie :", result.insertedId);

    return {
      statusCode: 200,
      body: JSON.stringify({ result: "success", id: result.insertedId }),
    };
  } catch (error) {
    console.error("❌ Erreur dans saveMessage:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        result: "error",
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}
