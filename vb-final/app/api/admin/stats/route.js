import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prediction from "@/models/Prediction";
import Notification from "@/models/Notification";
import { PACKAGES, SIGNUP_FEE_GHS, GHS_TO_USD } from "@/lib/constants";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ status: "approved" });
    const pendingUsers = await User.countDocuments({ status: "pending" });
    const rejectedUsers = await User.countDocuments({ status: "rejected" });

    // Package breakdown
    const packages = {};
    for (const pkg of PACKAGES) {
      const count = await User.countDocuments({ package: pkg.id, status: "approved" });
      const revenue = count * (SIGNUP_FEE_GHS + pkg.priceGHS);
      packages[pkg.id] = { ...pkg, count, revenueGHS: revenue, revenueUSD: parseFloat((revenue * GHS_TO_USD).toFixed(2)) };
    }

    const totalRevenueGHS = Object.values(packages).reduce((s, p) => s + p.revenueGHS, 0);

    const totalPredictions = await Prediction.countDocuments();
    const aiPredictions = await Prediction.countDocuments({ type: "ai" });
    const manualPredictions = await Prediction.countDocuments({ type: "manual" });
    const unreadNotifications = await Notification.countDocuments({ forAdmin: true, read: false });

    const recentPending = await User.find({ status: "pending" }).select("-password").sort({ createdAt: -1 }).limit(10).lean();

    return NextResponse.json({
      users: { total: totalUsers, approved: approvedUsers, pending: pendingUsers, rejected: rejectedUsers },
      revenue: { totalGHS: totalRevenueGHS, totalUSD: parseFloat((totalRevenueGHS * GHS_TO_USD).toFixed(2)) },
      packages,
      predictions: { total: totalPredictions, ai: aiPredictions, manual: manualPredictions },
      unreadNotifications,
      recentPending,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
