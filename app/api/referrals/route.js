import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// Generate unique referral code
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VB-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST — Admin generates and assigns a referral code to a user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.status !== "approved") return NextResponse.json({ error: "User must be approved first" }, { status: 400 });
    if (user.referralCode) return NextResponse.json({ error: `User already has code: ${user.referralCode}` }, { status: 400 });

    // Generate unique code (retry if collision)
    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = generateCode();
      const exists = await User.findOne({ referralCode: code });
      if (!exists) break;
      attempts++;
    }

    user.referralCode = code;
    await user.save();

    // Notify user
    await Notification.create({
      type: "referral",
      message: `You've been assigned a referral code: ${code}. Share it with friends — you earn GH₵10 for every approved signup!`,
      forUserId: user._id,
    });

    // Notify admin
    await Notification.create({
      type: "referral",
      message: `Referral code ${code} assigned to ${user.name} (${user.phone})`,
      forAdmin: true,
    });

    return NextResponse.json({ message: "Referral code assigned", code, user: { id: user._id, name: user.name, phone: user.phone, referralCode: code } });
  } catch (error) {
    console.error("Generate referral error:", error);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}

// GET — Admin views all referral data across platform
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // For admin: full platform referral data
    if (session.user.role === "admin") {
      const usersWithCodes = await User.find({ referralCode: { $ne: null } })
        .select("name phone referralCode referralBalance referralTotalEarned referralCount status package")
        .sort({ referralCount: -1 })
        .lean();

      const allReferred = await User.find({ referredBy: { $ne: null } })
        .select("name phone referredBy status package createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const totalBonusPaid = usersWithCodes.reduce((s, u) => s + (u.referralTotalEarned || 0), 0);
      const totalOutstanding = usersWithCodes.reduce((s, u) => s + (u.referralBalance || 0), 0);
      const totalReferrals = allReferred.length;
      const approvedReferrals = allReferred.filter(u => u.status === "approved").length;

      return NextResponse.json({
        usersWithCodes,
        allReferred,
        stats: {
          totalReferrals,
          approvedReferrals,
          pendingReferrals: allReferred.filter(u => u.status === "pending").length,
          totalBonusPaid,
          totalOutstanding,
          conversionRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
        },
      });
    }

    // For regular user: their own referral data
    const user = await User.findById(session.user.id)
      .select("referralCode referralBalance referralTotalEarned referralCount")
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let referrals = [];
    let stats = { total: 0, approved: 0, pending: 0, bonusGHS: 0, bonusUSD: 0 };

    if (user.referralCode) {
      referrals = await User.find({ referredBy: user.referralCode })
        .select("name phone status package createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const approved = referrals.filter(r => r.status === "approved").length;
      const pending = referrals.filter(r => r.status === "pending").length;

      stats = {
        total: referrals.length,
        approved,
        pending,
        bonusGHS: user.referralTotalEarned || 0,
        bonusUSD: parseFloat(((user.referralTotalEarned || 0) * 0.077).toFixed(2)),
        currentBalance: user.referralBalance || 0,
        currentBalanceUSD: parseFloat(((user.referralBalance || 0) * 0.077).toFixed(2)),
      };
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referrals,
      stats,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
