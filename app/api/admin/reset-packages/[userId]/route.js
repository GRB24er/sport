export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// POST — admin resets a single user's game packages
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset this user's gamePackages and pendingGamePackages
    user.gamePackages = {};
    user.pendingGamePackages = {};
    await user.save();

    // Notify the user immediately
    await Notification.create({
      type: "system",
      message: "🔄 Your game packages have been reset by the admin. Please subscribe again to continue receiving predictions.",
      forUserId: user._id,
      read: false,
      createdAt: new Date(),
    });

    // Log for admin
    await Notification.create({
      type: "system",
      message: `🔄 Admin reset packages for user: ${user.name} (${user.phone}).`,
      forAdmin: true,
    });

    return NextResponse.json({
      message: `Packages reset for ${user.name}.`,
      userId: user._id,
    });
  } catch (error) {
    console.error("Reset user packages error:", error);
    return NextResponse.json({ error: "Failed to reset packages" }, { status: 500 });
  }
}
