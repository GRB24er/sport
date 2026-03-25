export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";
import ReferralEarning from "@/models/ReferralEarning";

const PKG_PRICES_DEF = { gold: 250, platinum: 500, diamond: 1000 };
const PKG_NAMES = { gold: "Gold", platinum: "Platinum", diamond: "Diamond" };
const GAME_NAMES = { "instant-virtual": "Instant Virtual", "egames": "eGames" };
const PROV_NAMES = { telecel: "Telecel Cash" };

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

async function getPkgPrices() {
  try {
    const s = await Settings.findOne({ key: "main" }).lean();
    if (!s) return PKG_PRICES_DEF;
    return { gold: s.goldPrice || 250, platinum: s.platinumPrice || 500, diamond: s.diamondPrice || 1000 };
  } catch (e) { return PKG_PRICES_DEF; }
}

// POST — user submits per-game package purchase
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const PKG_PRICES = await getPkgPrices();
    const { gameId, packageId, paymentProvider, referenceNumber, senderName, paymentScreenshot } = await req.json();

    if (!gameId || !packageId || !paymentProvider || !referenceNumber) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (!paymentScreenshot) {
      return NextResponse.json({ error: "Payment screenshot is required for verification" }, { status: 400 });
    }
    if (!PKG_PRICES[packageId]) return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    if (!GAME_NAMES[gameId]) return NextResponse.json({ error: "Invalid game" }, { status: 400 });

    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") return NextResponse.json({ error: "Account not active" }, { status: 403 });

    const gp = mToObj(user.gamePackages);
    if (gp[gameId]) return NextResponse.json({ error: `You already have ${PKG_NAMES[gp[gameId].package]} for ${GAME_NAMES[gameId]}` }, { status: 400 });

    const pgp = mToObj(user.pendingGamePackages);
    if (pgp[gameId]) return NextResponse.json({ error: `You already have a pending request for ${GAME_NAMES[gameId]}` }, { status: 400 });

    const updateKey = `pendingGamePackages.${gameId}`;
    await User.updateOne({ _id: user._id }, {
      $set: { [updateKey]: { package: packageId, referenceNumber, paymentProvider, senderName: senderName || "", paymentScreenshot, date: new Date() } }
    });

    const provLabel = PROV_NAMES[paymentProvider] || paymentProvider;
    await Notification.create({
      type: "payment",
      message: `📦 ${GAME_NAMES[gameId]} — ${user.name} (${user.phone}) wants ${PKG_NAMES[packageId]} (GH₵${PKG_PRICES[packageId]}). ${provLabel}. Ref: ${referenceNumber}${senderName ? `. Sender: ${senderName}` : ""}`,
      forAdmin: true, relatedUserId: user._id,
      metadata: { type: "package_purchase", gameId, packageId, paymentProvider, referenceNumber, senderName },
    });

    await Notification.create({
      type: "system",
      message: `Your ${PKG_NAMES[packageId]} for ${GAME_NAMES[gameId]} is submitted. Ref: ${referenceNumber}. Your package will be activated shortly.`,
      forUserId: user._id,
    });

    return NextResponse.json({ message: "Submitted", gameId, packageId });
  } catch (error) {
    console.error("Package POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET — admin gets all pending package requests
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const PKG_PRICES = await getPkgPrices();
    // Only fetch users that actually have pending packages (avoids N+1 on all users)
    const users = await User.find({
      "pendingGamePackages": { $exists: true, $ne: {} }
    }).select("name phone email sportyBetId pendingGamePackages").lean();

    const requests = [];
    for (const u of users) {
      const pending = mToObj(u.pendingGamePackages);
      for (const [gameId, r] of Object.entries(pending)) {
        if (r && r.package) {
          requests.push({
            userId: u._id.toString(), userName: u.name, userPhone: u.phone, userEmail: u.email, sportyBetId: u.sportyBetId,
            gameId, gameName: GAME_NAMES[gameId] || gameId,
            packageId: r.package, packageName: PKG_NAMES[r.package] || r.package, packagePrice: PKG_PRICES[r.package] || 0,
            referenceNumber: r.referenceNumber, paymentProvider: r.paymentProvider,
            providerName: PROV_NAMES[r.paymentProvider] || r.paymentProvider,
            senderName: r.senderName || "", paymentScreenshot: r.paymentScreenshot || null, date: r.date,
          });
        }
      }
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date));
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Package GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH — admin approves or rejects per-game package
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const PKG_PRICES = await getPkgPrices();
    const { userId, gameId, action } = await req.json();

    if (!userId || !gameId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "userId, gameId, and action required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pending = mToObj(user.pendingGamePackages);
    const req2 = pending[gameId];
    if (!req2) return NextResponse.json({ error: "No pending request for this game" }, { status: 400 });

    const pkgName = PKG_NAMES[req2.package] || req2.package;
    const gameName = GAME_NAMES[gameId] || gameId;
    const pkgPrice = PKG_PRICES[req2.package] || 0;

    if (action === "approve") {
      await User.updateOne({ _id: user._id }, {
        $set: { [`gamePackages.${gameId}`]: { package: req2.package, predictionsUsed: 0, activatedAt: new Date() } },
        $unset: { [`pendingGamePackages.${gameId}`]: "" },
        $inc: { amountPaidGHS: pkgPrice },
      });

      // Credit referrer if this user was referred
      if (user.referredBy) {
        const referrer = await User.findOne({ referralCode: user.referredBy, status: "approved" });
        if (referrer) {
          let REFERRAL_BONUS = 50;
          try { const s = await Settings.findOne({ key: "main" }).lean(); if (s?.referralBonusGHS) REFERRAL_BONUS = s.referralBonusGHS; } catch (e) {}
          referrer.referralBalance = (referrer.referralBalance || 0) + REFERRAL_BONUS;
          referrer.referralTotalEarned = (referrer.referralTotalEarned || 0) + REFERRAL_BONUS;
          await referrer.save();
          await ReferralEarning.create({
            referrerId: referrer._id, referredUserId: user._id,
            type: "package", gameId, packageId: req2.package,
            amountPaid: pkgPrice, amountEarned: REFERRAL_BONUS,
          });
          await Notification.create({ type: "referral", message: `🎉 You earned GH₵${REFERRAL_BONUS}! ${user.name} bought ${pkgName} for ${gameName} (GH₵${pkgPrice}).`, forUserId: referrer._id });
        }
      }

      await Notification.create({ type: "system", message: `🎉 Your ${pkgName} for ${gameName} is activated! Go play!`, forUserId: user._id });
      await Notification.create({ type: "system", message: `✅ ${pkgName} for ${gameName} activated for ${user.name}. Revenue: GH₵${pkgPrice}`, forAdmin: true });
      return NextResponse.json({ message: `${pkgName} for ${gameName} activated` });
    }

    if (action === "reject") {
      await User.updateOne({ _id: user._id }, { $unset: { [`pendingGamePackages.${gameId}`]: "" } });
      await Notification.create({ type: "system", message: `❌ Your ${pkgName} for ${gameName} was rejected. Contact support.`, forUserId: user._id });
      return NextResponse.json({ message: "Rejected" });
    }
  } catch (error) {
    console.error("Package PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// v2
