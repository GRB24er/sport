export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await connectDB();
    let s = await Settings.findOne({ key: "main" });
    if (!s) s = await Settings.create({ key: "main" });
    return NextResponse.json({ settings: s.toObject() });
  } catch (e) {
    console.error("Settings GET error:", e.message);
    return NextResponse.json({ settings: {}, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    delete body._id; delete body.__v; delete body.key; delete body.createdAt; delete body.updatedAt;
    const settings = await Settings.findOneAndUpdate({ key: "main" }, { $set: body }, { new: true, upsert: true });
    return NextResponse.json({ settings: settings.toObject(), message: "Settings saved" });
  } catch (e) {
    console.error("Settings PATCH error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
