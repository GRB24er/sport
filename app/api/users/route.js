export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";

const SIGNUP_FEE_DEF = 50;

// POST — Register
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, password, referenceNumber, paymentProvider, senderName, referralUsed } = body;

    if (!name || !email || !phone || !password || !referenceNumber) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Get signup fee from settings
    let SIGNUP_FEE = SIGNUP_FEE_DEF;
    try {
      const s = await Settings.findOne({ key: "main" }).lean();
      if (s?.signupFeeGHS) SIGNUP_FEE = s.signupFeeGHS;
    } catch (e) {}

    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return NextResponse.json({ error: existing.phone === phone ? "Phone already registered" : "Email already registered" }, { status: 400 });
    }

    if (referralUsed) {
      const referrer = await User.findOne({ referralCode: referralUsed, status: "approved" });
      if (!referrer) {
        return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
      }
    }

    const sportyBetId = `SB-${phone}`;
    const user = await User.create({
      name, email, phone, password,
      referenceNumber,
      paymentProvider: paymentProvider || "",
      referredBy: referralUsed || null,
      referralCode: null,
      sportyBetId,
      amountPaidGHS: SIGNUP_FEE,
      status: "pending",
    });

    await Notification.create({
      type: "payment",
      message: `${name} (${phone}) submitted registration: ${referenceNumber} — GH₵${SIGNUP_FEE}${senderName ? ` | Sender: ${senderName}` : ""}${referralUsed ? ` | Referred by: ${referralUsed}` : ""}`,
      forAdmin: true,
      relatedUserId: user._id,
      metadata: { referenceNumber, phone, paymentProvider, senderName, referralUsed },
    });

    return NextResponse.json({
      message: "Registration submitted. Awaiting admin verification.",
      user: { id: user._id, name: user.name, phone: user.phone, sportyBetId, status: user.status },
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}

// GET — List users (admin only)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit")) || 50, 200);
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== "all") query.status = status;

    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// v2
