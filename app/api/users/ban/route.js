export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// POST — Ban a user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId, reason, hours, banIP } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bannedUntil = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

    user.isBanned = true;
    user.banReason = reason || "Violated terms of service";
    user.bannedAt = new Date();
    user.bannedUntil = bannedUntil;
    user.bannedBy = session.user.name || "Admin";
    if (banIP && user.lastLoginIP) {
      user.bannedIP = user.lastLoginIP;
    }
    user.status = "suspended";
    await user.save();

    await Notification.create({
      type: "system",
      message: `Your account has been ${bannedUntil ? `suspended for ${hours} hour(s)` : "permanently banned"}. Reason: ${user.banReason}`,
      forUserId: user._id,
    });

    return NextResponse.json({
      message: `User ${user.name} has been banned${bannedUntil ? ` for ${hours} hours` : " permanently"}`,
      user: { id: user._id, name: user.name, isBanned: true, bannedUntil },
    });
  } catch (error) {
    console.error("Ban error:", error);
    return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }
}

// DELETE — Unban a user
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.isBanned = false;
    user.banReason = "";
    user.bannedAt = null;
    user.bannedUntil = null;
    user.bannedBy = null;
    user.bannedIP = null;
    user.status = "approved";
    await user.save();

    await Notification.create({
      type: "system",
      message: "Your account has been unbanned. You can now log in again.",
      forUserId: user._id,
    });

    return NextResponse.json({ message: `User ${user.name} has been unbanned` });
  } catch (error) {
    console.error("Unban error:", error);
    return NextResponse.json({ error: "Failed to unban user" }, { status: 500 });
  }
}
