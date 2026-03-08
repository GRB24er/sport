import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Upload from "@/models/Upload";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const query = session.user.role === "admin" ? {} : { userId: session.user.id };

    const uploads = await Upload.find(query)
      .populate("userId", "name phone package")
      .populate("predictionId", "match totalOdd")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ uploads });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
  }
}
