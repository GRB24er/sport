export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  siteName: { type: String, default: "VirtualBet" },
  siteTagline: { type: String, default: "AI-Powered Predictions" },
  signupFeeGHS: { type: Number, default: 50 },
  referralBonusGHS: { type: Number, default: 10 },
  goldPrice: { type: Number, default: 250 }, goldMaxPreds: { type: Number, default: 1 }, goldOdds: { type: String, default: "3-5 Odds" },
  platinumPrice: { type: Number, default: 500 }, platinumMaxPreds: { type: Number, default: 2 }, platinumOdds: { type: String, default: "5-15 Odds" },
  diamondPrice: { type: Number, default: 1000 }, diamondMaxPreds: { type: Number, default: 4 }, diamondOdds: { type: String, default: "15-50 Odds" },
  mtnNumber: { type: String, default: "" }, mtnName: { type: String, default: "" },
  telecelNumber: { type: String, default: "" }, telecelName: { type: String, default: "" },
  airteltigoNumber: { type: String, default: "" }, airteltigoName: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" },
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

async function getSettings() {
  let s = await Settings.findOne({ key: "main" });
  if (!s) s = await Settings.create({ key: "main" });
  return s;
}

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    return NextResponse.json({ settings: {} });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    delete body._id; delete body.__v; delete body.key;
    const settings = await Settings.findOneAndUpdate({ key: "main" }, { $set: body }, { new: true, upsert: true });
    return NextResponse.json({ settings, message: "Settings saved" });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}



