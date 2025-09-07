// netlify/functions/savePartner.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "ampbenin";

let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  clientPromise = client.connect();
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("partners");

    const newPartner = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || "",
      organization: data.organization?.trim() || "",
      partnershipType: data.partnershipType || "",
      message: data.message.trim(),
      createdAt: new Date(),
    };

    await collection.insertOne(newPartner);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: "success",
        message: "Partenaire ajouté avec succès",
      }),
    };
  } catch (err) {
    console.error("❌ Erreur dans savePartner:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur : " + err.message }),
    };
  }
}
