export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";

const PKG_PRICES_DEF = { gold: 250, platinum: 500, diamond: 1000 };
const PKG_NAMES = { gold: "Gold", platinum: "Platinum", diamond: "Diamond" };
const PKG_ORDER = ["gold", "platinum", "diamond"];
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

// POST — user submits a package upgrade request for an existing game subscription
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const PKG_PRICES = await getPkgPrices();
    const { gameId, newPackageId, paymentProvider, referenceNumber, senderName, paymentScreenshot } = await req.json();

    if (!gameId || !newPackageId || !paymentProvider || !referenceNumber) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (!paymentScreenshot) {
      return NextResponse.json({ error: "Payment screenshot is required for verification" }, { status: 400 });
    }
    if (!PKG_PRICES[newPackageId]) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }
    if (!GAME_NAMES[gameId]) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") {
      return NextResponse.json({ error: "Account not active" }, { status: 403 });
    }

    const gp = mToObj(user.gamePackages);
    const currentPkg = gp[gameId];

    if (!currentPkg) {
      return NextResponse.json({ error: `You don't have an active subscription for ${GAME_NAMES[gameId]}. Please subscribe first.` }, { status: 400 });
    }

    const currentIdx = PKG_ORDER.indexOf(currentPkg.package);
    const newIdx = PKG_ORDER.indexOf(newPackageId);

    if (newIdx <= currentIdx) {
      return NextResponse.json({ error: `You can only upgrade to a higher package. Your current package is ${PKG_NAMES[currentPkg.package]}.` }, { status: 400 });
    }

    // Check for existing pending upgrade request
    const pgp = mToObj(user.pendingGamePackages);
    if (pgp[gameId]) {
      return NextResponse.json({ error: `You already have a pending request for ${GAME_NAMES[gameId]}` }, { status: 400 });
    }

    // Store upgrade request in pendingGamePackages (same structure as new purchase)
    const updateKey = `pendingGamePackages.${gameId}`;
    await User.updateOne({ _id: user._id }, {
      $set: {
        [updateKey]: {
          package: newPackageId,
          referenceNumber,
          paymentProvider,
          senderName: senderName || "",
          paymentScreenshot,
          date: new Date(),
          isUpgrade: true,
          fromPackage: currentPkg.package,
        }
      }
    });

    const provLabel = PROV_NAMES[paymentProvider] || paymentProvider;
    const gameName = GAME_NAMES[gameId];
    const currentPkgName = PKG_NAMES[currentPkg.package];
    const newPkgName = PKG_NAMES[newPackageId];

    await Notification.create({
      type: "payment",
      message: `⬆️ UPGRADE REQUEST — ${gameName}: ${user.name} (${user.phone}) upgrading from ${currentPkgName} → ${newPkgName} (GH₵${PKG_PRICES[newPackageId]}). ${provLabel}. Ref: ${referenceNumber}${senderName ? `. Sender: ${senderName}` : ""}`,
      forAdmin: true,
      relatedUserId: user._id,
      metadata: { type: "package_upgrade", gameId, fromPackage: currentPkg.package, toPackage: newPackageId, paymentProvider, referenceNumber, senderName },
    });

    await Notification.create({
      type: "system",
      message: `Your upgrade request from ${currentPkgName} to ${newPkgName} for ${gameName} has been submitted. Ref: ${referenceNumber}. Your upgrade will be activated shortly.`,
      forUserId: user._id,
    });

    return NextResponse.json({ message: "Upgrade request submitted", gameId, newPackageId });
  } catch (error) {
    console.error("Package upgrade POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
