import mongoose from "mongoose";

const MissionSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String },
  lieu: { type: String },
  dateDebut: { type: Date },
  dateFin: { type: Date },
});

export default mongoose.models.Mission || mongoose.model("Mission", MissionSchema);
