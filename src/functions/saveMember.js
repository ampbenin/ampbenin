// netlify/functions/saveMember.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
console.log("📌 URI Mongo chargée :", uri ? "✅ Oui" : "❌ Non");

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
      body: JSON.stringify({ result: "error", error: "Méthode non autorisée" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const client = await clientPromise;
    const db = client.db("amp-benin");
    const collection = db.collection("membres");

    const newMember = {
      nom: data.nom.trim(),
      prenom: data.prenom?.trim() || "",
      email: data.email.trim().toLowerCase(),
      telephone: data.telephone.trim(),
      adresse: data.adresse.trim(),
      profession: data.profession?.trim() || "",
      domaine_interet: data.domaine_interet || [],
      motivation: data.motivation?.trim() || "",
      date_inscription: new Date(),
    };

    const result = await collection.insertOne(newMember);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: "success",
        message: "Membre ajouté avec succès",
        id: result.insertedId,
      }),
    };
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement du membre :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: "error", error: error.message }),
    };
  }
}
