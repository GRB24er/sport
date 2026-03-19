import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  siteName: { type: String, default: "VirtualBet" },
  siteTagline: { type: String, default: "AI-Powered Predictions" },
  signupFeeGHS: { type: Number, default: 50 },
  referralBonusGHS: { type: Number, default: 50 },
  goldPrice: { type: Number, default: 250 }, goldMaxPreds: { type: Number, default: 1 }, goldOdds: { type: String, default: "3-5 Odds" },
  platinumPrice: { type: Number, default: 500 }, platinumMaxPreds: { type: Number, default: 2 }, platinumOdds: { type: String, default: "5-15 Odds" },
  diamondPrice: { type: Number, default: 1000 }, diamondMaxPreds: { type: Number, default: 4 }, diamondOdds: { type: String, default: "15-50 Odds" },
  mtnNumber: { type: String, default: "" }, mtnName: { type: String, default: "" },
  telecelNumber: { type: String, default: "" }, telecelName: { type: String, default: "" },
  airteltigoNumber: { type: String, default: "" }, airteltigoName: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
