import mongoose from "mongoose";

const pickSchema = new mongoose.Schema({
  market: { type: String, required: true },
  pick: { type: String, required: true },
  odd: { type: Number, default: 1.5 },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  matchTime: { type: String, default: "" },
  picks: [pickSchema],
}, { _id: false });

const uploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, default: "" },
    userPhone: { type: String, default: "" },
    gameId: { type: String, default: "instant-virtual" },
    imageData: { type: String, required: true },
    status: { type: String, enum: ["pending", "responded", "rejected"], default: "pending", index: true },
    // Admin fills — multiple matches
    matches: [matchSchema],
    totalOdd: { type: Number, default: 0 },
    adminNote: { type: String, default: "" },
    sportyBetLink: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Upload || mongoose.model("Upload", uploadSchema);
