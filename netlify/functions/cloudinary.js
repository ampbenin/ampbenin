// netlify/functions/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

// Avec CLOUDINARY_URL directement dans les variables d'environnement
cloudinary.config({
  secure: true, // active https par défaut
});

export default cloudinary;
