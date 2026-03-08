import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { REFERRAL_BONUS_GHS, GHS_TO_USD } from "@/lib/constants";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const referralCode = session.user.role === "admin"
      ? new URL(req.url).searchParams.get("code")
      : session.user.referralCode;

    if (!referralCode) {
      return NextResponse.json({ referrals: [], stats: { total: 0, approved: 0, bonusGHS: 0, bonusUSD: 0 } });
    }

    const referrals = await User.find({ referredBy: referralCode })
      .select("name phone package status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const approved = referrals.filter(r => r.status === "approved");
    const bonusGHS = approved.length * REFERRAL_BONUS_GHS;

    return NextResponse.json({
      referralCode,
      referrals,
      stats: {
        total: referrals.length,
        approved: approved.length,
        pending: referrals.filter(r => r.status === "pending").length,
        bonusGHS,
        bonusUSD: parseFloat((bonusGHS * GHS_TO_USD).toFixed(2)),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
