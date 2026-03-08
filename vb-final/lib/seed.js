// Run: node lib/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("❌ Set MONGODB_URI in .env.local"); process.exit(1); }

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;

  await db.collection("users").deleteMany({});
  await db.collection("predictions").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("uploads").deleteMany({});
  console.log("🗑️  Cleared data");

  const pw = await bcrypt.hash("pass123", 12);

  const users = await db.collection("users").insertMany([
    {
      name: "Kwame Asante", email: "kwame@email.com", phone: "0241234567", password: pw,
      role: "user", status: "approved", package: "gold",
      referenceNumber: "MTN-8374652", paymentProvider: "mtn",
      referralCode: "VG-4567-AX3R", sportyBetId: "SB-0241234567",
      referredBy: null, amountPaidGHS: 50, predictionsUsed: 0,
      avatar: "KA", approvedAt: new Date(), createdAt: new Date("2025-03-01"), updatedAt: new Date(),
    },
    {
      name: "Ama Serwaa", email: "ama@email.com", phone: "0551234567", password: pw,
      role: "user", status: "approved", package: "platinum",
      referenceNumber: "VOD-9283746", paymentProvider: "telecel",
      referralCode: "VG-4567-BK7P", sportyBetId: "SB-0551234567",
      referredBy: "VG-4567-AX3R", amountPaidGHS: 550, predictionsUsed: 1,
      avatar: "AS", approvedAt: new Date(), createdAt: new Date("2025-03-02"), updatedAt: new Date(),
    },
    {
      name: "Kofi Mensah", email: "kofi@email.com", phone: "0271234567", password: pw,
      role: "user", status: "pending", package: "gold",
      referenceNumber: "MTN-1029384", paymentProvider: "mtn",
      referralCode: "VG-4567-CM2Q", sportyBetId: "SB-0271234567",
      referredBy: "VG-4567-AX3R", amountPaidGHS: 50, predictionsUsed: 0,
      avatar: "KM", createdAt: new Date("2025-03-05"), updatedAt: new Date(),
    },
  ]);

  console.log(`✅ Seeded ${users.insertedCount} users`);

  const ids = Object.values(users.insertedIds);

  await db.collection("predictions").insertMany([
    {
      userId: ids[0], type: "ai", homeTeam: "FC Barcelona VR", awayTeam: "Liverpool VR",
      match: "FC Barcelona VR vs Liverpool VR",
      predictions: [
        { market: "Match Result", pick: "Home Win", confidence: 78, odd: 1.85 },
        { market: "Over/Under 2.5", pick: "Over 2.5", confidence: 82, odd: 1.65 },
      ],
      totalOdd: 3.05, confidence: 80,
      analysis: "AI detected strong attacking patterns from Barcelona VR.",
      status: "delivered", createdAt: new Date("2025-03-04"), updatedAt: new Date(),
    },
  ]);

  await db.collection("notifications").insertMany([
    {
      type: "payment",
      message: "Kofi Mensah (0271234567) submitted payment ref: MTN-1029384 — GH₵50 (≈ $3.85)",
      forAdmin: true, relatedUserId: ids[2], read: false,
      createdAt: new Date("2025-03-05"), updatedAt: new Date(),
    },
  ]);

  console.log("✅ Seeded predictions & notifications");
  console.log("\n📋 Demo Logins:");
  console.log("   Admin: 0200000000 / admin123");
  console.log("   User (Gold): 0241234567 / pass123");
  console.log("   User (Platinum): 0551234567 / pass123");
  console.log("   User (Pending): 0271234567 / pass123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error("❌", e); process.exit(1); });
