import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Prediction from "@/models/Prediction";
import User from "@/models/User";
import Notification from "@/models/Notification";

const GAME_NAMES = { "instant-virtual": "Instant Virtual", "egames": "eGames" };
const PKG_LIMITS = { gold: 1, platinum: 2, diamond: 4 };

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

// POST — admin creates a prediction for a game
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { gameId, homeTeam, awayTeam, predictions, analysis, adminNote, matchTime } = body;

    if (!gameId || !homeTeam || !awayTeam || !predictions?.length) {
      return NextResponse.json({ error: "Game, teams, and predictions required" }, { status: 400 });
    }
    if (!GAME_NAMES[gameId]) return NextResponse.json({ error: "Invalid game" }, { status: 400 });

    const totalOdd = parseFloat(predictions.filter(p => p.odd).slice(0, 4).reduce((a, p) => a * parseFloat(p.odd || 1), 1).toFixed(2));
    const confidence = Math.floor(predictions.filter(p => p.confidence).reduce((a, p) => a + parseInt(p.confidence || 60), 0) / Math.max(predictions.length, 1));

    const pred = await Prediction.create({
      type: "admin",
      gameId,
      homeTeam, awayTeam,
      match: `${homeTeam} vs ${awayTeam}`,
      predictions: predictions.filter(p => p.pick).map(p => ({
        market: p.market || "Pick",
        pick: p.pick,
        confidence: parseInt(p.confidence) || 60,
        odd: parseFloat(p.odd) || 1.5,
      })),
      totalOdd,
      confidence,
      analysis: analysis || "",
      adminNote: adminNote || "",
      matchTime: matchTime || null,
      status: "active",
      claimedBy: [],
    });

    return NextResponse.json({ message: "Prediction created", prediction: pred });
  } catch (error) {
    console.error("Create prediction error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET — get predictions (admin sees all, user sees for their subscribed games)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    if (session.user.role === "admin") {
      const query = { type: "admin" };
      if (gameId) query.gameId = gameId;
      const predictions = await Prediction.find(query).sort({ createdAt: -1 }).limit(100).lean();
      return NextResponse.json({ predictions });
    }

    // User — only see predictions for games they have packages for
    const user = await User.findById(session.user.id).select("gamePackages status").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const gp = user.gamePackages instanceof Map ? Object.fromEntries(user.gamePackages) : (user.gamePackages || {});
    const subscribedGames = Object.keys(gp);

    if (subscribedGames.length === 0) {
      return NextResponse.json({ predictions: [], message: "No active subscriptions" });
    }

    const query = { type: "admin", status: "active" };
    if (gameId) {
      if (!subscribedGames.includes(gameId)) {
        return NextResponse.json({ predictions: [], message: "Not subscribed to this game" });
      }
      query.gameId = gameId;
    } else {
      query.gameId = { $in: subscribedGames };
    }

    const predictions = await Prediction.find(query).sort({ createdAt: -1 }).limit(50).lean();

    // Mark which ones user has already claimed
    const userId = user._id.toString();
    const mapped = predictions.map(p => ({
      ...p,
      claimed: (p.claimedBy || []).includes(userId),
    }));

    return NextResponse.json({ predictions: mapped, subscribedGames });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH — user claims a prediction (uses 1 from their package)
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Admin: delete prediction
    if (session.user.role === "admin") {
      const { predictionId, action } = await req.json();
      if (action === "delete" && predictionId) {
        await Prediction.findByIdAndDelete(predictionId);
        return NextResponse.json({ message: "Deleted" });
      }
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // User: claim prediction
    const { predictionId } = await req.json();
    if (!predictionId) return NextResponse.json({ error: "predictionId required" }, { status: 400 });

    const pred = await Prediction.findById(predictionId);
    if (!pred) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });

    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") return NextResponse.json({ error: "Account not active" }, { status: 403 });

    const gameId = pred.gameId;
    const gp = mToObj(user.gamePackages);
    const gamePkg = gp[gameId];

    if (!gamePkg) return NextResponse.json({ error: "No package for this game" }, { status: 403 });

    // Check if already claimed
    const userId = user._id.toString();
    if ((pred.claimedBy || []).includes(userId)) {
      return NextResponse.json({ error: "Already claimed", prediction: pred });
    }

    const maxPreds = PKG_LIMITS[gamePkg.package] || 1;
    const used = gamePkg.predictionsUsed || 0;

    if (used >= maxPreds) {
      await User.updateOne({ _id: user._id }, { $unset: { [`gamePackages.${gameId}`]: "" } });
      return NextResponse.json({ error: "EXHAUSTED", message: "Package expired. Subscribe again." }, { status: 429 });
    }

    // ATOMIC: Claim only if not already claimed (prevents race condition)
    const claimResult = await Prediction.findOneAndUpdate(
      { _id: pred._id, claimedBy: { $ne: userId } },
      { $addToSet: { claimedBy: userId } },
      { new: true }
    );
    if (!claimResult) {
      return NextResponse.json({ error: "Already claimed", prediction: pred });
    }

    const newUsed = used + 1;
    const exhausted = newUsed >= maxPreds;

    // ATOMIC: Use condition to prevent double-increment
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
      type: "prediction_request",
      message: `${user.name} claimed prediction ${newUsed}/${maxPreds} on ${gameName}${exhausted ? " — EXPIRED" : ""} — ${pred.match}`,
      forAdmin: true, relatedUserId: user._id,
    });

    return NextResponse.json({
      message: "Claimed",
      prediction: pred,
      predictionsUsed: newUsed,
      maxPredictions: maxPreds,
      exhausted,
    });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
