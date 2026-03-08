import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },

    // Site
    siteName: { type: String, default: "VirtualBet" },
    siteTagline: { type: String, default: "AI-Powered SportyBet Predictions" },

    // Referral
    referralBonusGHS: { type: Number, default: 10 },
    referralEnabled: { type: Boolean, default: true },

    // Registration
    signupFeeGHS: { type: Number, default: 50 },

    // Packages
    goldPrice: { type: Number, default: 200 },
    goldMaxPreds: { type: Number, default: 1 },
    goldOdds: { type: String, default: "3–5 Odds" },
    platinumPrice: { type: Number, default: 500 },
    platinumMaxPreds: { type: Number, default: 2 },
    platinumOdds: { type: String, default: "5–15 Odds" },
    diamondPrice: { type: Number, default: 1000 },
    diamondMaxPreds: { type: Number, default: 4 },
    diamondOdds: { type: String, default: "15–50 Odds" },

    // Payment numbers
    mtnNumber: { type: String, default: "" },
    mtnName: { type: String, default: "VirtualBet GH" },
    telecelNumber: { type: String, default: "" },
    telecelName: { type: String, default: "VirtualBet GH" },
    airteltigoNumber: { type: String, default: "" },
    airteltigoName: { type: String, default: "VirtualBet GH" },

    // WhatsApp
    whatsappNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
