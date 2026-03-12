export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Round from "@/models/Round";
import User from "@/models/User";
import Notification from "@/models/Notification";

const GAME_NAMES = { "instant-virtual": "Instant Virtual", "egames": "eGames" };
const PKG_LIMITS_DEF = { gold: 1, platinum: 2, diamond: 4 };

import Settings from "@/models/Settings";

async function getPkgLimits() {
  try {
    
    const s = await Settings.findOne({ key: "main" }).lean();
    if (!s) return PKG_LIMITS_DEF;
    return { gold: s.goldMaxPreds || 1, platinum: s.platinumMaxPreds || 2, diamond: s.diamondMaxPreds || 4 };
  } catch (e) { return PKG_LIMITS_DEF; }
}

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

// Auto-expire check
async function expireOldRounds() {
  const now = new Date();
  await Round.updateMany(
    { status: "live", expiresAt: { $lte: now, $ne: null } },
    { $set: { status: "expired", closedAt: now } }
  );
}

// POST — admin creates a round (draft or live)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { gameId, matches, adminNote, goLive, expiresInMinutes, sportyBetLink } = await req.json();

    if (!gameId || !GAME_NAMES[gameId]) return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    if (!matches || matches.length < 1 || matches.length > 3) return NextResponse.json({ error: "1-3 matches required" }, { status: 400 });

    for (const m of matches) {
      if (!m.homeTeam || !m.awayTeam || !m.picks?.length) {
        return NextResponse.json({ error: `All matches need teams and at least 1 pick` }, { status: 400 });
      }
    }

    // Calculate total odd from all picks across all matches
    let allOdds = [];
    matches.forEach(m => m.picks.forEach(p => { if (p.odd) allOdds.push(parseFloat(p.odd)); }));
    const totalOdd = parseFloat(allOdds.reduce((a, o) => a * o, 1).toFixed(2));

    const expiresAt = expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60000) : null;

    const round = await Round.create({
      gameId,
      matches: matches.map(m => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchTime: m.matchTime || "",
        picks: m.picks.filter(p => p.pick).map(p => ({
          market: p.market,
          pick: p.pick,
          odd: parseFloat(p.odd) || 1.5,
        })),
      })),
      totalOdd,
      adminNote: adminNote || "",
      sportyBetLink: sportyBetLink || "",
      status: goLive ? "live" : "draft",
      publishedAt: goLive ? new Date() : null,
      expiresAt,
    });

    if (goLive) {
      // Notify all approved users
      const users = await User.find({ status: "approved" }).select("_id").lean();
      if (users.length > 0) {
        await Notification.insertMany(users.map(u => ({
          type: "system",
          message: `🔥 New ${GAME_NAMES[gameId]} round is LIVE! ${matches.length} matches ready. Open the app to play!`,
          forUserId: u._id,
        })));
      }
      await Notification.create({
        type: "system",
        message: `✅ ${GAME_NAMES[gameId]} round published with ${matches.length} matches. ${users.length} users notified.`,
        forAdmin: true,
      });
    }

    return NextResponse.json({ message: goLive ? "Round is LIVE!" : "Draft saved", round });
  } catch (error) {
    console.error("Round create error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}

// GET — get rounds
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await expireOldRounds();

    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    // Admin sees everything
    if (session.user.role === "admin") {
      const query = {};
      if (gameId) query.gameId = gameId;
      const rounds = await Round.find(query).sort({ createdAt: -1 }).limit(50).lean();
      return NextResponse.json({ rounds });
    }

    // User — only live rounds for subscribed games
    const user = await User.findById(session.user.id).select("gamePackages status").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const gp = mToObj(user.gamePackages);
    const subscribedGames = Object.keys(gp);

    if (subscribedGames.length === 0) {
      return NextResponse.json({ rounds: [], subscribed: false });
    }

    const query = { status: "live" };
    if (gameId) {
      if (!subscribedGames.includes(gameId)) {
        return NextResponse.json({ rounds: [], subscribed: false });
      }
      query.gameId = gameId;
    } else {
      query.gameId = { $in: subscribedGames };
    }

    const rounds = await Round.find(query).sort({ createdAt: -1 }).lean();
    const userId = user._id.toString();

    const mapped = rounds.map(r => ({
      ...r,
      claimed: (r.claimedBy || []).includes(userId),
      // Hide match picks if not claimed
      matches: (r.claimedBy || []).includes(userId)
        ? r.matches
        : r.matches.map(m => ({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, matchTime: m.matchTime, picks: [] })),
    }));

    return NextResponse.json({ rounds: mapped, subscribed: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH — publish/close round (admin) or claim round (user)
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // Admin actions: publish, close, delete
    if (session.user.role === "admin") {
      const { roundId, action, expiresInMinutes } = body;
      if (!roundId || !action) return NextResponse.json({ error: "roundId and action required" }, { status: 400 });

      if (action === "publish") {
        const expiresAt = expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60000) : null;
        const round = await Round.findByIdAndUpdate(roundId, {
          status: "live", publishedAt: new Date(), expiresAt,
        }, { new: true });
        if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const users = await User.find({ status: "approved" }).select("_id").lean();
        if (users.length > 0) {
          await Notification.insertMany(users.map(u => ({
            type: "system",
            message: `🔥 New ${GAME_NAMES[round.gameId]} round is LIVE! ${round.matches.length} matches. Open app to play!`,
            forUserId: u._id,
          })));
        }
        return NextResponse.json({ message: "Published!", round });
      }

      if (action === "close") {
        await Round.findByIdAndUpdate(roundId, { status: "closed", closedAt: new Date() });
        return NextResponse.json({ message: "Round closed" });
      }

      if (action === "delete") {
        await Round.findByIdAndDelete(roundId);
        return NextResponse.json({ message: "Deleted" });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // User action: claim round
    const { roundId } = body;
    if (!roundId) return NextResponse.json({ error: "roundId required" }, { status: 400 });

    const round = await Round.findById(roundId).lean();
    if (!round || round.status !== "live") return NextResponse.json({ error: "Round not available" }, { status: 404 });

    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") return NextResponse.json({ error: "Account not active" }, { status: 403 });

    const userId = user._id.toString();
    if ((round.claimedBy || []).includes(userId)) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    const gameId = round.gameId;
    const PKG_LIMITS = await getPkgLimits();
    const gp = mToObj(user.gamePackages);
    const gamePkg = gp[gameId];

    if (!gamePkg) return NextResponse.json({ error: "No package for this game" }, { status: 403 });

    const maxPreds = PKG_LIMITS[gamePkg.package] || 1;
    const used = gamePkg.predictionsUsed || 0;

    if (used >= maxPreds) {
      await User.updateOne({ _id: user._id }, { $unset: { [`gamePackages.${gameId}`]: "" } });
      return NextResponse.json({ error: "EXHAUSTED", message: "Package expired. Subscribe again." }, { status: 429 });
    }

    // ATOMIC: Claim the round only if not already claimed (prevents race condition)
    const claimResult = await Round.findOneAndUpdate(
      { _id: round._id, claimedBy: { $ne: userId } },
      { $addToSet: { claimedBy: userId } },
      { new: true }
    );
    if (!claimResult) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    const newUsed = used + 1;
    const exhausted = newUsed >= maxPreds;

    // ATOMIC: Increment predictionsUsed and check limit atomically
    if (exhausted) {
      await User.updateOne({ _id: user._id }, { $unset: { [`gamePackages.${gameId}`]: "" } });
    } else {
      await User.updateOne(
        { _id: user._id, [`gamePackages.${gameId}.predictionsUsed`]: used },
        { $set: { [`gamePackages.${gameId}.predictionsUsed`]: newUsed } }
      );
    }

    const gameName = GAME_NAMES[gameId] || gameId;
    await Notification.create({
      type: "system",
      message: `${user.name} unlocked ${gameName} round (${newUsed}/${maxPreds})${exhausted ? " — PACKAGE EXPIRED" : ""}`,
      forAdmin: true, relatedUserId: user._id,
    });

    // Return full round with picks
    const fullRound = await Round.findById(roundId).lean();

    return NextResponse.json({
      message: "Unlocked!",
      round: fullRound,
      predictionsUsed: newUsed,
      maxPredictions: maxPreds,
      exhausted,
    });
  } catch (error) {
    console.error("Round PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// v2
