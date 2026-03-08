import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prediction from "@/models/Prediction";
import Notification from "@/models/Notification";

// GET single user
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(params.id).select("-password").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (session.user.role !== "admin" && session.user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const referralCount = await User.countDocuments({ referredBy: user.referralCode, status: "approved" });
    const predictionCount = await Prediction.countDocuments({ userId: user._id });

    return NextResponse.json({ user: { ...user, referralCount, predictionCount } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findByIdAndDelete(params.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await Prediction.deleteMany({ userId: params.id });
    await Notification.deleteMany({ $or: [{ relatedUserId: params.id }, { forUserId: params.id }] });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PATCH update user (admin — upgrade package, reset predictions, etc.)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // If upgrading package, reset prediction count
    if (body.package) {
      body.predictionsUsed = 0;
    }

    const user = await User.findByIdAndUpdate(params.id, { $set: body }, { new: true, runValidators: true }).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
