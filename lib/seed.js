const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("Set MONGODB_URI in .env.local"); process.exit(1); }

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  await db.collection("users").deleteMany({});
  await db.collection("predictions").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("uploads").deleteMany({});
  await db.collection("messages").deleteMany({});
  await db.collection("settings").deleteMany({});
  console.log("Cleared all data");

  // Create default settings
  await db.collection("settings").insertOne({
    key: "main",
    siteName: "VirtualBet",
    siteTagline: "AI-Powered SportyBet Predictions",
    referralBonusGHS: 10,
    referralEnabled: true,
    signupFeeGHS: 50,
    goldPrice: 200, goldMaxPreds: 1, goldOdds: "3-5 Odds",
    platinumPrice: 500, platinumMaxPreds: 2, platinumOdds: "5-15 Odds",
    diamondPrice: 1000, diamondMaxPreds: 4, diamondOdds: "15-50 Odds",
    mtnNumber: "", mtnName: "VirtualBet GH",
    telecelNumber: "", telecelName: "VirtualBet GH",
    airteltigoNumber: "", airteltigoName: "VirtualBet GH",
    whatsappNumber: "",
    createdAt: new Date(), updatedAt: new Date(),
  });
  console.log("Default settings created");

  const pw = await bcrypt.hash("pass123", 12);

  const users = await db.collection("users").insertMany([
    {
      name: "Kwame Asante", email: "kwame@email.com", phone: "0241234567", password: pw,
      role: "user", status: "approved",
      package: "gold",  // This user already bought Gold
      referenceNumber: "MTN-8374652", paymentProvider: "mtn",
      sportyBetId: "SB-0241234567",
      referralCode: "VB-KW4M-3X7R", referredBy: null,
      amountPaidGHS: 250, predictionsUsed: 0,
      referralBalance: 10, referralTotalEarned: 10, referralCount: 1,
      avatar: "KA", approvedAt: new Date(), createdAt: new Date("2025-03-01"), updatedAt: new Date(),
    },
    {
      name: "Ama Serwaa", email: "ama@email.com", phone: "0551234567", password: pw,
      role: "user", status: "approved",
      package: null,  // Registered but hasn't bought a package yet
      referenceNumber: "VOD-9283746", paymentProvider: "telecel",
      sportyBetId: "SB-0551234567",
      referralCode: null, referredBy: "VB-KW4M-3X7R",
      amountPaidGHS: 50, predictionsUsed: 0,
      referralBalance: 0, referralTotalEarned: 0, referralCount: 0,
      avatar: "AS", approvedAt: new Date(), createdAt: new Date("2025-03-02"), updatedAt: new Date(),
    },
    {
      name: "Kofi Mensah", email: "kofi@email.com", phone: "0271234567", password: pw,
      role: "user", status: "pending",
      package: null,  // Pending user, no package
      referenceNumber: "MTN-1029384", paymentProvider: "mtn",
      sportyBetId: "SB-0271234567",
      referralCode: null, referredBy: "VB-KW4M-3X7R",
      amountPaidGHS: 50, predictionsUsed: 0,
      referralBalance: 0, referralTotalEarned: 0, referralCount: 0,
      avatar: "KM", createdAt: new Date("2025-03-05"), updatedAt: new Date(),
    },
  ]);

  console.log(`Seeded ${users.insertedCount} users`);

  console.log("\nDemo Logins:");
  console.log(`   Admin: ${process.env.ADMIN_PHONE} / ${process.env.ADMIN_PASSWORD}`);
  console.log("   User (has Gold pkg): 0241234567 / pass123");
  console.log("   User (no package yet): 0551234567 / pass123");
  console.log("   User (pending): 0271234567 / pass123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e); process.exit(1); });
