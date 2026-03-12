import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";

// In-memory cache for settings (refreshes every 60s or on PATCH)
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    // Return cached settings if fresh
    const now = Date.now();
    if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
      return NextResponse.json({ settings: settingsCache });
    }

    await connectDB();
    let s = await Settings.findOne({ key: "main" }).lean();
    if (!s) {
      const created = await Settings.create({ key: "main" });
      s = created.toObject();
    }

    // Update cache
    settingsCache = s;
    settingsCacheTime = now;

    return NextResponse.json({ settings: s });
  } catch (e) {
    console.error("Settings GET error:", e.message);
    return NextResponse.json({ settings: settingsCache || {}, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    delete body._id; delete body.__v; delete body.key; delete body.createdAt; delete body.updatedAt;
    const settings = await Settings.findOneAndUpdate({ key: "main" }, { $set: body }, { new: true, upsert: true, lean: true });

    // Invalidate cache so next GET picks up new values
    settingsCache = settings;
    settingsCacheTime = Date.now();

    return NextResponse.json({ settings, message: "Settings saved" });
  } catch (e) {
    console.error("Settings PATCH error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
