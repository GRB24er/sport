export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// POST — admin resets ALL members' game packages (gamePackages + pendingGamePackages)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Reset all users' gamePackages and pendingGamePackages to empty maps
    const result = await User.updateMany(
      { role: "user" },
      {
        $set: {
          gamePackages: {},
          pendingGamePackages: {},
        },
      }
    );

    // Send a notification to all approved users informing them of the reset
    const approvedUsers = await User.find({ role: "user", status: "approved" }).select("_id").lean();
    const notifDocs = approvedUsers.map(u => ({
      type: "system",
      message: "🔄 Your game packages have been reset by the admin. Please subscribe again to continue playing.",
      forUserId: u._id,
      read: false,
      createdAt: new Date(),
    }));

    if (notifDocs.length > 0) {
      await Notification.insertMany(notifDocs);
    }

    // Notify admin
    await Notification.create({
      type: "system",
      message: `🔄 Admin reset all packages. ${result.modifiedCount} user(s) affected.`,
      forAdmin: true,
    });

    return NextResponse.json({
      message: `All packages reset successfully. ${result.modifiedCount} user(s) affected.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Reset packages error:", error);
    return NextResponse.json({ error: "Failed to reset packages" }, { status: 500 });
  }
}
