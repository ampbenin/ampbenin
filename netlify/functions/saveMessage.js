const { MongoClient } = require('mongodb');

let client;
let clientPromise;

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
}

if (!clientPromise) {
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  clientPromise = client.connect();
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ result: 'error', error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const client = await clientPromise;
    const db = client.db("AMPBENIN_DB_SITEWEB");
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

    await collection.insertOne(messageDoc);

    return {
      statusCode: 200,
      body: JSON.stringify({ result: 'success' }),
    };

  } catch (error) {
    console.error("Erreur dans saveMessage:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: error.message }),
    };
  }
};
