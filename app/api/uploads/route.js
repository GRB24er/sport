export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Upload from "@/models/Upload";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";

const PKG_LIMITS_DEF = { gold: 1, platinum: 2, diamond: 4 };
const GAME_NAMES = { "instant-virtual": "Instant Virtual", "egames": "eGames" };

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

async function getPkgLimits() {
  try {
    const s = await Settings.findOne({ key: "main" }).lean();
    if (!s) return PKG_LIMITS_DEF;
    return { gold: s.goldMaxPreds || 1, platinum: s.platinumMaxPreds || 2, diamond: s.diamondMaxPreds || 4 };
  } catch (e) { return PKG_LIMITS_DEF; }
}

// POST — user uploads screenshot (uses 1 credit)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { imageBase64, gameId } = await req.json();
    const gId = gameId || "instant-virtual";

    if (!imageBase64) return NextResponse.json({ error: "Screenshot required" }, { status: 400 });

    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") return NextResponse.json({ error: "Account not active" }, { status: 403 });

    const PKG_LIMITS = await getPkgLimits();
    const gp = mToObj(user.gamePackages);
    const gamePkg = gp[gId];

    if (!gamePkg) {
      return NextResponse.json({ error: "NO_PACKAGE", message: "No active package. Subscribe first." }, { status: 403 });
    }

    const maxPreds = PKG_LIMITS[gamePkg.package] || 1;
    const used = gamePkg.predictionsUsed || 0;

    if (used >= maxPreds) {
      await User.updateOne({ _id: user._id }, { $unset: { [`gamePackages.${gId}`]: "" } });
      return NextResponse.json({ error: "EXHAUSTED", message: "Package expired. Subscribe again." }, { status: 429 });
    }

    // ATOMIC: Increment credit FIRST to prevent race condition (two concurrent uploads)
    const newUsed = used + 1;
    const exhausted = newUsed >= maxPreds;
    const creditUpdate = exhausted
      ? { $unset: { [`gamePackages.${gId}`]: "" } }
      : { $set: { [`gamePackages.${gId}.predictionsUsed`]: newUsed } };

    const atomicResult = await User.findOneAndUpdate(
      { _id: user._id, [`gamePackages.${gId}.predictionsUsed`]: used },
      creditUpdate,
      { new: true }
    );
    if (!atomicResult) {
      return NextResponse.json({ error: "Credit already used. Please refresh." }, { status: 409 });
    }

    const upload = await Upload.create({
      userId: user._id, userName: user.name, userPhone: user.phone,
      gameId: gId, imageData: imageBase64, status: "pending",
    });

    await Notification.create({
      type: "system",
      message: `📸 ${user.name} (${user.phone}) uploaded screenshot for ${GAME_NAMES[gId]} — credit ${newUsed}/${maxPreds}${exhausted ? " — LAST CREDIT" : ""}`,
      forAdmin: true, relatedUserId: user._id,
    });

    return NextResponse.json({
      message: "Screenshot uploaded!",
      upload: { _id: upload._id, status: "pending", createdAt: upload.createdAt },
      predictionsUsed: newUsed, maxPredictions: maxPreds, exhausted,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}

// GET — admin gets all uploads OR user gets their own
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (session.user.role === "admin") {
      const query = {};
      if (status && status !== "all") query.status = status;
      // Exclude imageData for list view — each base64 screenshot is 500KB-2MB
      const wantImage = searchParams.get("withImage") === "true";
      const projection = wantImage ? {} : { imageData: 0 };
      const uploads = await Upload.find(query, projection).sort({ createdAt: -1 }).limit(100).lean();
      return NextResponse.json({ uploads });
    }

    const uploads = await Upload.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json({ uploads });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH — admin responds with prediction
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { uploadId, matches, adminNote, action, sportyBetLink } = await req.json();

    if (!uploadId) return NextResponse.json({ error: "uploadId required" }, { status: 400 });

    if (action === "delete") {
      await Upload.findByIdAndDelete(uploadId);
      return NextResponse.json({ message: "Deleted" });
    }

    if (action === "reject") {
      const upload = await Upload.findByIdAndUpdate(uploadId, { status: "rejected", adminNote: adminNote || "Unclear screenshot" }, { new: true });
      if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await Notification.create({ type: "system", message: `❌ Your screenshot was rejected: ${adminNote || "Unclear image"}. Please upload a clearer one.`, forUserId: upload.userId });
      return NextResponse.json({ message: "Rejected" });
    }

    if (!matches?.length || !matches.some(m => m.homeTeam && m.awayTeam)) {
      return NextResponse.json({ error: "At least one match with teams required" }, { status: 400 });
    }

    const cleanMatches = matches.filter(m => m.homeTeam && m.awayTeam).map(m => ({
      homeTeam: m.homeTeam, awayTeam: m.awayTeam, matchTime: m.matchTime || "",
      picks: (m.picks || []).filter(p => p.pick).map(p => ({ market: p.market, pick: p.pick, odd: parseFloat(p.odd) || 1.5 })),
    }));

    let allOdds = [];
    cleanMatches.forEach(m => m.picks.forEach(p => allOdds.push(p.odd)));
    const totalOdd = parseFloat(allOdds.reduce((a, o) => a * o, 1).toFixed(2));

    const upload = await Upload.findByIdAndUpdate(uploadId, {
      status: "responded", matches: cleanMatches, totalOdd,
      adminNote: adminNote || "", sportyBetLink: sportyBetLink || "", respondedAt: new Date(),
    }, { new: true });

    if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Notification.create({
      type: "system",
      message: `✅ Your prediction (${cleanMatches.length} matches) is ready! Total odd: ${totalOdd}x. Open the app to view!`,
      forUserId: upload.userId,
    });

    return NextResponse.json({ message: "Prediction sent!", upload });
  } catch (error) {
    console.error("Upload PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// v2
