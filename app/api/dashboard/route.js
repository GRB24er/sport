export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";
import FreeGame from "@/models/FreeGame";
import ReferralEarning from "@/models/ReferralEarning";

// Single consolidated endpoint for user dashboard — 1 cold start instead of 5
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    const results = await Promise.allSettled([
      User.findById(userId).select("-password").lean(),
      Settings.findOne({ key: "main" }).lean(),
      Notification.find({ forUserId: userId }).sort({ createdAt: -1 }).limit(50).lean(),
      FreeGame.find({ published: true }).sort({ createdAt: -1 }).lean(),
    ]);

    const v = (i) => results[i].status === "fulfilled" ? results[i].value : null;
    const user = v(0);
    const settings = v(1);
    const notifications = v(2) || [];
    const freeGames = v(3) || [];

    // Referral data — only fetch if user has a code
    let referrals = [];
    let earnings = [];
    let refStats = null;
    if (user?.referralCode) {
      const [refs, earns] = await Promise.all([
        User.find({ referredBy: user.referralCode })
          .select("name phone status createdAt").sort({ createdAt: -1 }).lean(),
        ReferralEarning.find({ referrerId: userId })
          .populate("referredUserId", "name phone").sort({ createdAt: -1 }).lean(),
      ]);
      referrals = refs;
      earnings = earns;
      const approved = referrals.filter(r => r.status === "approved").length;
      refStats = {
        total: referrals.length,
        approved,
        pending: referrals.filter(r => r.status === "pending").length,
        bonusGHS: user.referralTotalEarned || 0,
        currentBalance: user.referralBalance || 0,
      };
    }

    return NextResponse.json({
      user,
      settings,
      notifications,
      freeGames,
      referrals,
      earnings,
      refStats,
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
