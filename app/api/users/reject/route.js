import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const user = await User.findByIdAndUpdate(userId, { status: "rejected" }, { new: true });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await Notification.create({
      type: "rejection",
      message: `❌ Your registration was rejected. Contact support for assistance.`,
      forUserId: user._id,
    });

    return NextResponse.json({ message: `${user.name} rejected` });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
