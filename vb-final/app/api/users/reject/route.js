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
    const { userId, reason } = await req.json();

    const user = await User.findByIdAndUpdate(userId, { status: "rejected" }, { new: true }).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await Notification.updateMany({ relatedUserId: userId, type: "payment", forAdmin: true }, { read: true });

    await Notification.create({
      type: "rejection",
      message: `Your registration was rejected. ${reason || "Payment could not be verified."} Contact support.`,
      forUserId: user._id,
    });

    return NextResponse.json({ message: "User rejected", user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
