export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

const REFERRAL_BONUS_DEF = 10;

async function getReferralBonus() {
  try {
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection?.db;
    if (!db) return REFERRAL_BONUS_DEF;
    const s = await db.collection("settings").findOne({ key: "main" });
    return s?.referralBonusGHS || REFERRAL_BONUS_DEF;
  } catch (e) { return REFERRAL_BONUS_DEF; }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.status === "approved") return NextResponse.json({ error: "Already approved" }, { status: 400 });

    user.status = "approved";
    await user.save();

    const REFERRAL_BONUS = await getReferralBonus();

    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy, status: "approved" });
      if (referrer) {
        referrer.referralBalance = (referrer.referralBalance || 0) + REFERRAL_BONUS;
        referrer.referralTotalEarned = (referrer.referralTotalEarned || 0) + REFERRAL_BONUS;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();

        await Notification.create({
          type: "referral",
          message: `🎉 You earned GH₵${REFERRAL_BONUS} referral bonus! ${user.name} just got approved.`,
          forUserId: referrer._id,
        });
      }
    }

    await Notification.create({
      type: "approval",
      message: `✅ Your account has been approved! Welcome to VirtualBet.`,
      forUserId: user._id,
    });

    return NextResponse.json({ message: `${user.name} approved` });
  } catch (e) {
    console.error("Approve error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

