// netlify/functions/generateCertificate.js
import { connectDB } from "./mongo.js";
import Volunteer from "./models/Volunteer.js";
import Mission from "./models/Mission.js";
import cloudinary from "./cloudinary.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    await connectDB();

    const { titre, email, mode } = JSON.parse(event.body);

    if (!titre) {
      return { statusCode: 400, body: JSON.stringify({ message: "Titre de mission requis" }) };
    }

    // 🔹 Récupérer la mission
    const mission = await Mission.findOne({ titre });
    if (!mission) {
      return { statusCode: 404, body: JSON.stringify({ message: "Mission introuvable" }) };
    }

    // 🔹 Récupérer les volontaires selon le mode
    let volunteers = [];
    if (mode === "Tous les volontaires") {
      volunteers = await Volunteer.find({ mission: mission._id, statut: "Mission validée" });
    } else if (mode === "Un volontaire" && email) {
      const v = await Volunteer.findOne({ email, mission: mission._id, statut: "Mission validée" });
      if (v) volunteers.push(v);
    }

    if (volunteers.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: "Aucun volontaire trouvé à traiter" }) };
    }

    let generatedCount = 0;

    for (const volunteer of volunteers) {
      // Vérifier si attestation déjà générée
      const alreadyGenerated = volunteer.attestations.some(
        (a) => a.missionId.toString() === mission._id.toString()
      );
      if (alreadyGenerated) continue;

      // 🔹 Création du PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      page.drawText(`Attestation de Mission`, {
        x: 180,
        y: 350,
        size: 24,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`Nom: ${volunteer.nom} ${volunteer.prenom}`, {
        x: 50,
        y: 300,
        size: 18,
        font: timesRomanFont,
      });
      page.drawText(`Mission: ${mission.titre}`, {
        x: 50,
        y: 270,
        size: 16,
        font: timesRomanFont,
      });

      // 🔹 QR code
      const qrData = `Volontaire:${volunteer._id};Mission:${mission._id}`;
      const qrPng = await QRCode.toBuffer(qrData);
      const qrImage = await pdfDoc.embedPng(qrPng);
      page.drawImage(qrImage, { x: 450, y: 200, width: 100, height: 100 });

      // 🔹 Générer PDF et fichier temporaire
      const pdfBytes = await pdfDoc.save();
      const tmpFilePath = path.join(
        "/tmp",
        `${volunteer.nom}_${volunteer.prenom}_attestation.pdf`
      );
      fs.writeFileSync(tmpFilePath, pdfBytes);

      // 🔹 Upload Cloudinary
      const uploadResult = await cloudinary.uploader.upload(tmpFilePath, {
        folder: `attestations/${mission.titre}`,
        resource_type: "auto",
        public_id: `${volunteer.nom}_${volunteer.prenom}_${Date.now()}`,
      });

      // 🔹 Mise à jour volunteer
      volunteer.attestations.push({
        fileName: path.basename(tmpFilePath),
        fileUrl: uploadResult.secure_url,
        missionId: mission._id,
      });
      await volunteer.save();

      fs.unlinkSync(tmpFilePath);
      generatedCount++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch terminé",
        generated: generatedCount,
        total: volunteers.length,
        mission: mission.titre,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}
