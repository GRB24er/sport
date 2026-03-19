import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId } = await req.json();

    const user = await User.findByIdAndUpdate(
      userId,
      { status: "approved", approvedAt: new Date(), approvedBy: session.user.name },
      { new: true }
    ).select("-password");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Mark payment notifications read
    await Notification.updateMany(
      { relatedUserId: userId, type: "payment", forAdmin: true },
      { read: true }
    );

    // Notify user
    await Notification.create({
      type: "approval",
      message: `Your account has been approved! Welcome to VirtualBet. Your Gold package is now active with 1 AI prediction. Login to start.`,
      forUserId: user._id,
    });

    // Notify referrer
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        await Notification.create({
          type: "referral",
          message: `${user.name} signed up using your referral code! You earned GH₵50 bonus.`,
          forUserId: referrer._id,
        });
      }
    }

    return NextResponse.json({ message: "User approved", user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
