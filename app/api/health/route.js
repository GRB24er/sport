export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Simple diagnostic — no auth required, just tests DB
export async function GET() {
  const checks = {};
  try {
    checks.mongoUri = process.env.MONGODB_URI ? "SET (hidden)" : "MISSING!";
    checks.nextauthUrl = process.env.NEXTAUTH_URL || "NOT SET";
    checks.nextauthSecret = process.env.NEXTAUTH_SECRET ? "SET" : "MISSING!";
    checks.adminPhone = process.env.ADMIN_PHONE ? "SET" : "MISSING!";

    await connectDB();
    checks.dbConnection = "OK";

    const count = await User.countDocuments();
    checks.userCount = count;

    const sample = await User.findOne({}).select("name status createdAt").lean();
    checks.sampleUser = sample ? { name: sample.name, status: sample.status } : "NO USERS FOUND";

    return NextResponse.json({ status: "OK", checks });
  } catch (error) {
    checks.error = error.message;
    return NextResponse.json({ status: "FAILED", checks }, { status: 500 });
  }
}
