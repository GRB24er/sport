import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { generateReferralCode, generateSportyBetId } from "@/lib/utils";
import { SIGNUP_FEE_GHS, PACKAGES, fmtBoth } from "@/lib/constants";

// POST — Register new user
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, password, referenceNumber, paymentProvider, referralUsed } = body;

    if (!name || !email || !phone || !password || !referenceNumber) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return NextResponse.json({ error: existing.phone === phone ? "Phone already registered" : "Email already registered" }, { status: 400 });
    }

    // All new users start on Gold package
    const user = await User.create({
      name,
      email,
      phone,
      password,
      package: "gold",
      referenceNumber,
      paymentProvider: paymentProvider || "",
      referredBy: referralUsed || null,
      referralCode: generateReferralCode(phone),
      sportyBetId: generateSportyBetId(phone),
      amountPaidGHS: SIGNUP_FEE_GHS,
      status: "pending",
    });

    // Notify admin
    await Notification.create({
      type: "payment",
      message: `${name} (${phone}) submitted payment ref: ${referenceNumber} — Registration fee: ${fmtBoth(SIGNUP_FEE_GHS)}`,
      forAdmin: true,
      relatedUserId: user._id,
      metadata: { referenceNumber, phone, paymentProvider },
    });

    return NextResponse.json({
      message: "Registration submitted. Awaiting admin verification.",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        sportyBetId: user.sportyBetId,
        referralCode: user.referralCode,
        package: user.package,
        status: user.status,
      },
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

    const query = {};
    if (status && status !== "all") query.status = status;

    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
