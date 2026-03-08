export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";

const messageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: "SupportThread", required: true, index: true },
  sender: { type: String, enum: ["user", "admin"], required: true },
  senderName: { type: String, default: "" },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lastMessage: { type: String, default: "" },
  lastDate: { type: Date, default: Date.now },
  adminUnread: { type: Number, default: 0 },
  userUnread: { type: Number, default: 0 },
}, { timestamps: true });

const SupportThread = mongoose.models.SupportThread || mongoose.model("SupportThread", threadSchema);
const SupportMessage = mongoose.models.SupportMessage || mongoose.model("SupportMessage", messageSchema);

// GET — admin: all threads | user: their thread messages
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    if (session.user.role === "admin") {
      if (threadId) {
        const messages = await SupportMessage.find({ threadId }).sort({ createdAt: 1 }).lean();
        await SupportMessage.updateMany({ threadId, sender: "user", read: false }, { read: true });
        await SupportThread.updateOne({ _id: threadId }, { adminUnread: 0 });
        const thread = await SupportThread.findById(threadId).lean();
        const user = thread ? await User.findById(thread.userId).select("name phone email").lean() : null;
        return NextResponse.json({ messages, user });
      }
      const threads = await SupportThread.find().sort({ lastDate: -1 }).lean();
      const enriched = await Promise.all(threads.map(async t => {
        const user = await User.findById(t.userId).select("name phone email").lean();
        return { ...t, user, unread: t.adminUnread || 0 };
      }));
      const totalUnread = enriched.reduce((s, t) => s + (t.unread || 0), 0);
      return NextResponse.json({ threads: enriched, totalUnread });
    }

    // User — get their messages
    let thread = await SupportThread.findOne({ userId: session.user.id });
    if (!thread) return NextResponse.json({ messages: [], threadId: null });
    const messages = await SupportMessage.find({ threadId: thread._id }).sort({ createdAt: 1 }).lean();
    await SupportMessage.updateMany({ threadId: thread._id, sender: "admin", read: false }, { read: true });
    await SupportThread.updateOne({ _id: thread._id }, { userUnread: 0 });
    return NextResponse.json({ messages, threadId: thread._id });
  } catch (e) {
    console.error("Support GET error:", e);
    return NextResponse.json({ threads: [], totalUnread: 0, messages: [] });
  }
}

// POST — send message
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { body, threadId } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const isAdmin = session.user.role === "admin";

    if (isAdmin) {
      if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });
      await SupportMessage.create({ threadId, sender: "admin", senderName: "Admin", body });
      await SupportThread.updateOne({ _id: threadId }, { lastMessage: body, lastDate: new Date(), $inc: { userUnread: 1 }, adminUnread: 0 });
      return NextResponse.json({ message: "Sent" });
    }

    // User sending
    let thread = await SupportThread.findOne({ userId: session.user.id });
    if (!thread) thread = await SupportThread.create({ userId: session.user.id });
    await SupportMessage.create({ threadId: thread._id, sender: "user", senderName: session.user.name || "User", body });
    await SupportThread.updateOne({ _id: thread._id }, { lastMessage: body, lastDate: new Date(), $inc: { adminUnread: 1 }, userUnread: 0 });
    return NextResponse.json({ message: "Sent", threadId: thread._id });
  } catch (e) {
    console.error("Support POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

