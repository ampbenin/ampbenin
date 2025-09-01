// netlify/functions/models/Admin.js
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // identifiant
  password: { type: String, required: true }, // hashé
  role: {
    type: String,
    enum: ["CadreA", "CadreB", "CadreC"], // rôles possibles
    required: true,
  },
  missions: [{ type: String }], // ex: attribuées à CadreB
});

// ✅ éviter de redéfinir le modèle si déjà existant (utile en Netlify/Lambda)
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;
