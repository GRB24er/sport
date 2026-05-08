export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// POST — admin sends a private message to a specific user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId, subject, message } = await req.json();

    if (!userId || !message?.trim()) {
      return NextResponse.json({ error: "userId and message are required" }, { status: 400 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const title = subject?.trim() || "Message from Admin";
    await Notification.create({
      type: "direct",
      message: `💬 ${title}: ${message.trim()}`,
      forUserId: user._id,
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: `Message sent to ${user.name} (${user.phone}).`,
      recipient: { id: user._id, name: user.name, phone: user.phone },
    });
  } catch (error) {
    console.error("Message user error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
