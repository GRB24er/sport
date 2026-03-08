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

const roundSchema = new mongoose.Schema(
  {
    gameId: { type: String, enum: ["instant-virtual", "egames"], required: true, index: true },
    status: { type: String, enum: ["draft", "live", "closed", "expired"], default: "draft", index: true },
    matches: { type: [matchSchema], validate: [v => v.length >= 1 && v.length <= 3, "1-3 matches required"] },
    totalOdd: { type: Number, default: 1 },
    adminNote: { type: String, default: "" },
    sportyBetLink: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    claimedBy: [{ type: String }],
  },
  { timestamps: true }
);

roundSchema.index({ gameId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Round || mongoose.model("Round", roundSchema);
