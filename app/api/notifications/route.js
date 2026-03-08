import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const query = session.user.role === "admin" ? { forAdmin: true } : { forUserId: session.user.id };

    const notifications = await Notification.find(query)
      .populate("relatedUserId", "name phone")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { markAll, notificationId } = await req.json();

    if (markAll) {
      const query = session.user.role === "admin" ? { forAdmin: true } : { forUserId: session.user.id };
      await Notification.updateMany(query, { read: true });
    } else if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Notification.deleteMany({ forAdmin: true });

    return NextResponse.json({ message: "All notifications deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
