export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { SupportThread, SupportMessage } from "@/models/Support";

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

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { body, threadId } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    if (session.user.role === "admin") {
      if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });
      await SupportMessage.create({ threadId, sender: "admin", senderName: "Admin", body });
      await SupportThread.updateOne({ _id: threadId }, { lastMessage: body, lastDate: new Date(), $inc: { userUnread: 1 }, adminUnread: 0 });
      return NextResponse.json({ message: "Sent" });
    }

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
