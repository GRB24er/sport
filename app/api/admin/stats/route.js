import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prediction from "@/models/Prediction";
import Upload from "@/models/Upload";
import Notification from "@/models/Notification";

// In-memory cache (refreshes every 30s)
let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL = 30 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return cached stats if fresh
    const now = Date.now();
    if (statsCache && (now - statsCacheTime) < CACHE_TTL) {
      return NextResponse.json(statsCache);
    }

    await connectDB();

    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      totalPredictions,
      totalUploads,
      pendingUploads,
      unreadNotifications,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "approved" }),
      Prediction.countDocuments({}),
      Upload.countDocuments({}),
      Upload.countDocuments({ status: "pending" }),
      Notification.countDocuments({ forAdmin: true, read: false }),
    ]);

    const data = {
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: approvedUsers,
      },
      predictions: {
        total: totalPredictions,
      },
      uploads: totalUploads,
      pendingUploads,
      unreadNotifications,
    };

    // Update cache
    statsCache = data;
    statsCacheTime = now;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
