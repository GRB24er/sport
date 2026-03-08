export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";
import Notification from "@/models/Notification";

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  sentTo: { type: Number, default: 0 },
  sentBy: { type: String, default: "Admin" },
}, { timestamps: true });

const Broadcast = mongoose.models.Broadcast || mongoose.model("Broadcast", broadcastSchema);

export async function GET() {
  try {
    await connectDB();
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ broadcasts });
  } catch (e) {
    return NextResponse.json({ broadcasts: [] });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { title, message } = await req.json();
    if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

    const users = await User.find({ status: "approved" }).select("_id").lean();

    if (users.length > 0) {
      await Notification.insertMany(users.map(u => ({
        type: "system",
        message: `📢 ${title}: ${message}`,
        forUserId: u._id,
      })));
    }

    const broadcast = await Broadcast.create({ title, message, sentTo: users.length, sentBy: session.user.name || "Admin" });
    return NextResponse.json({ message: `Broadcast sent to ${users.length} users`, broadcast });
  } catch (e) {
    console.error("Broadcast error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { broadcastId } = await req.json();
    if (!broadcastId) return NextResponse.json({ error: "broadcastId required" }, { status: 400 });
    const Broadcast = mongoose.models.Broadcast;
    if (Broadcast) await Broadcast.findByIdAndDelete(broadcastId);
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

