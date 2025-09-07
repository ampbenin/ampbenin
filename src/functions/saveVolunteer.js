// netlify/functions/saveVolunteer.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DBNAME || "amp-benin";

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
    const collection = db.collection("volontaires");

    const newVolunteer = {
      name: data.name?.trim() || "",
      email: data.email?.trim() || "",
      phone: data.phone?.trim() || "",
      domain: data.domain?.trim() || "",
      motivation: data.motivation?.trim() || "",
      date: new Date(),
      status: "Nouveau",
    };

    const result = await collection.insertOne(newVolunteer);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: "success",
        id: result.insertedId,
      }),
    };
  } catch (err) {
    console.error("❌ Erreur saveVolunteer:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
