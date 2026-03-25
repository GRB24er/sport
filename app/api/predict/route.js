export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import Upload from "@/models/Upload";
import Round from "@/models/Round";

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

// Single consolidated endpoint for predict page — replaces 4 separate calls
// GET /api/predict?gameId=instant-virtual
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId") || "instant-virtual";
    const isIV = gameId === "instant-virtual";

    // Run all queries in parallel — 1 DB connection
    const queries = [
      User.findById(userId).select("-password -avatar -paymentScreenshot").lean(),
      Settings.findOne({ key: "main" }).lean(),
    ];

    if (isIV) {
      // Instant Virtual — fetch user's uploads
      queries.push(Upload.find({ userId }).sort({ createdAt: -1 }).lean());
    } else {
      // eGames — auto-expire then fetch live rounds
      const now = new Date();
      await Round.updateMany(
        { status: "live", expiresAt: { $lte: now, $ne: null } },
        { $set: { status: "expired", closedAt: now } }
      );
      queries.push(Round.find({ status: "live", gameId }).sort({ createdAt: -1 }).lean());
    }

    const results = await Promise.allSettled(queries);
    const v = (i) => results[i].status === "fulfilled" ? results[i].value : null;

    const user = v(0);
    const settings = v(1);

    const response = { user, settings };

    if (isIV) {
      response.uploads = v(2) || [];
    } else {
      const rounds = v(2) || [];
      const uid = user?._id?.toString();
      // Map rounds — hide picks for unclaimed rounds
      response.rounds = rounds.map(r => ({
        ...r,
        claimed: (r.claimedBy || []).includes(uid),
        matches: (r.claimedBy || []).includes(uid)
          ? r.matches
          : r.matches.map(m => ({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, matchTime: m.matchTime, picks: [] })),
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Predict page error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
