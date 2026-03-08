import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Prediction from "@/models/Prediction";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const query = session.user.role === "admin" ? {} : { userId: session.user.id };

    const predictions = await Prediction.find(query)
      .populate("userId", "name phone package")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ predictions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}
