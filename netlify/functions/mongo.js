import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI_SECOND, {
      dbName: "Missions", // <- tu peux préciser le nom de la DB
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("✅ Connexion à la 2ème base MongoDB réussie !");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB (2ème DB):", error);
    throw error;
  }
};
