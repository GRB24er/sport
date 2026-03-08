import mongoose from "mongoose";

const pickSchema = new mongoose.Schema(
  {
    market: { type: String, required: true },
    pick: { type: String, required: true },
    confidence: { type: Number, default: 0 },
    odd: { type: Number, default: 1.0 },
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["ai", "manual"], required: true },

    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    match: { type: String, required: true },

    predictions: [pickSchema],
    totalOdd: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },

    analysis: { type: String, default: "" },
    adminNote: { type: String, default: null },

    status: { type: String, enum: ["processing", "delivered", "expired"], default: "delivered" },
    uploadId: { type: mongoose.Schema.Types.ObjectId, ref: "Upload", default: null },
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

predictionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Prediction || mongoose.model("Prediction", predictionSchema);
