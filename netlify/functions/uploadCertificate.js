// netlify/functions/uploadCertificat.js
import { connectDB } from "./mongo.js"; // connexion MongoDB
import Volunteer from "./models/Volunteer.js"; // modèle Volunteer
import Mission from "./models/Mission.js"; // modèle Mission pour récupérer le titre
import cloudinary from "./cloudinary.js"; // config Cloudinary

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Méthode non autorisée" }),
      };
    }

    await connectDB();

    const body = JSON.parse(event.body);
    const { volunteerId, fileBase64, fileName, missionId, statut } = body;

    if (!volunteerId || !fileBase64 || !missionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "volunteerId, missionId et fichier requis" }),
      };
    }

    // Upload vers Cloudinary
    const uploadRes = await cloudinary.uploader.upload(fileBase64, {
      folder: "attestations",
      resource_type: "auto", // permet PDF et images
    });

    // Récupérer le titre de la mission
    const mission = await Mission.findById(missionId);

    // Mise à jour du Volunteer avec un nouvel objet dans attestations
    const volunteer = await Volunteer.findByIdAndUpdate(
      volunteerId,
      {
        $push: {
          attestations: {
            fileName: fileName || "attestation.pdf",
            fileUrl: uploadRes.secure_url,
            missionId: missionId,
            missionName: mission?.titre || "Nom mission inconnu",
            statut: statut || "Non disponible", // récupéré depuis la requête ou défaut
          },
        },
      },
      { new: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Certificat uploadé", volunteer }),
    };
  } catch (error) {
    console.error("Erreur uploadCertificat:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
}
