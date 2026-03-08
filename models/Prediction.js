import mongoose from "mongoose";

const pickSchema = new mongoose.Schema({
  market: { type: String, required: true },
  pick: { type: String, required: true },
  confidence: { type: Number, default: 60 },
  odd: { type: Number, default: 1.5 },
}, { _id: false });

const predictionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["admin", "ai"], default: "admin" },
    gameId: { type: String, default: "instant-virtual", index: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    match: { type: String, required: true },

    predictions: [pickSchema],

    totalOdd: { type: Number, default: 1 },
    confidence: { type: Number, default: 60 },

    analysis: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    matchTime: { type: String, default: "" },

    status: { type: String, enum: ["active", "delivered", "expired"], default: "active" },

    // Users who have claimed/viewed this prediction
    claimedBy: [{ type: String }],

    uploadId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

predictionSchema.index({ gameId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Prediction || mongoose.model("Prediction", predictionSchema);
