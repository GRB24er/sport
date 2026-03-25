export const dynamic = 'force-dynamic';
export const maxDuration = 30;
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Upload from "@/models/Upload";
import Round from "@/models/Round";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";
import Broadcast from "@/models/Broadcast";
import FreeGame from "@/models/FreeGame";
import { SupportThread } from "@/models/Support";
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

// ── 30-second in-memory cache ──
let dashCache = null;
let dashCacheTime = 0;
const CACHE_TTL = 30 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    if (dashCache && (now - dashCacheTime) < CACHE_TTL) {
      return NextResponse.json(dashCache);
    }

    await connectDB();

    // 7 queries instead of 11 — referral/package data derived from users query
    const results = await Promise.allSettled([
      // 0. Users — exclude password, avatar, paymentScreenshot (heavy base64)
      User.find({})
        .select("-password -avatar -paymentScreenshot")
        .sort({ createdAt: -1 }).lean(),
      // 1. Uploads — exclude imageData (500KB-2MB each)
      Upload.find({})
        .select("-imageData")
        .sort({ createdAt: -1 }).limit(100).lean(),
      // 2. Rounds (latest 50)
      Round.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      // 3. Notifications (admin, latest 50)
      Notification.find({ forAdmin: true })
        .populate("relatedUserId", "name phone")
        .sort({ createdAt: -1 }).limit(50).lean(),
      // 4. Settings
      Settings.findOne({ key: "main" }).lean(),
      // 5. Broadcasts (latest 20)
      Broadcast.find().sort({ createdAt: -1 }).limit(20).lean(),
      // 6. Support threads
      SupportThread.find().sort({ lastDate: -1 }).lean(),
      // 7. Referral earnings
      ReferralEarning.find({})
        .populate("referrerId", "name phone referralCode")
        .populate("referredUserId", "name phone")
        .sort({ createdAt: -1 }).limit(200).lean(),
      // 8. Free games
      FreeGame.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    const v = (i) => results[i].status === "fulfilled" ? results[i].value : null;

    const users = v(0) || [];
    const uploads = v(1) || [];
    const rounds = v(2) || [];
    const notifications = v(3) || [];
    const settings = v(4);
    const broadcasts = v(5) || [];
    const supportThreads = v(6) || [];
    const allEarnings = v(7) || [];
    const freeGames = v(8) || [];

    // --- Derive referral & package data from users (no extra queries) ---
    const usersWithCodes = [];
    const allReferred = [];
    const pkgUsers = [];
    const userMap = {};

    for (const u of users) {
      const uid = u._id.toString();
      userMap[uid] = u;
      if (u.referralCode) usersWithCodes.push(u);
      if (u.referredBy) allReferred.push(u);
      const pending = mToObj(u.pendingGamePackages);
      if (Object.keys(pending).length > 0) pkgUsers.push(u);
    }

    // --- Referral stats ---
    const totalBonusPaid = usersWithCodes.reduce((s, u) => s + (u.referralTotalEarned || 0), 0);
    const totalOutstanding = usersWithCodes.reduce((s, u) => s + (u.referralBalance || 0), 0);
    const totalReferrals = allReferred.length;
    const approvedReferrals = allReferred.filter(u => u.status === "approved").length;

    const referralData = {
      usersWithCodes,
      allReferred,
      allEarnings,
      stats: {
        totalReferrals,
        approvedReferrals,
        pendingReferrals: allReferred.filter(u => u.status === "pending").length,
        totalBonusPaid,
        totalOutstanding,
        conversionRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
      },
    };

    // --- Support threads (enrich from userMap) ---
    const enrichedThreads = supportThreads.map(t => {
      const u = userMap[t.userId?.toString()];
      return {
        ...t,
        user: u ? { name: u.name, phone: u.phone, email: u.email } : null,
        unread: t.adminUnread || 0,
      };
    });
    const totalUnread = enrichedThreads.reduce((s, t) => s + (t.unread || 0), 0);

    // --- Package requests (from pkgUsers derived above) ---
    const pkgPrices = settings
      ? { gold: settings.goldPrice || 250, platinum: settings.platinumPrice || 500, diamond: settings.diamondPrice || 1000 }
      : PKG_PRICES_DEF;

    const requests = [];
    for (const u of pkgUsers) {
      const pending = mToObj(u.pendingGamePackages);
      for (const [gameId, r] of Object.entries(pending)) {
        if (r && r.package) {
          requests.push({
            userId: u._id.toString(), userName: u.name, userPhone: u.phone,
            userEmail: u.email, sportyBetId: u.sportyBetId,
            gameId, gameName: GAME_NAMES[gameId] || gameId,
            packageId: r.package, packageName: PKG_NAMES[r.package] || r.package,
            packagePrice: pkgPrices[r.package] || 0,
            referenceNumber: r.referenceNumber, paymentProvider: r.paymentProvider,
            providerName: PROV_NAMES[r.paymentProvider] || r.paymentProvider,
            senderName: r.senderName || "", paymentScreenshot: r.paymentScreenshot || null, date: r.date,
          });
        }
      }
    }
    requests.sort((a, b) => new Date(b.date) - new Date(a.date));

    const unreadCount = notifications.filter(n => !n.read).length;

    let settingsObj = settings;
    if (!settingsObj) {
      try {
        const created = await Settings.create({ key: "main" });
        settingsObj = created.toObject();
      } catch (e) {
        settingsObj = {};
      }
    }

    const result = {
      users,
      uploads,
      rounds,
      notifications,
      unreadCount,
      referralData,
      settings: settingsObj,
      broadcasts,
      support: { threads: enrichedThreads, totalUnread },
      packageRequests: requests,
      freeGames,
    };

    dashCache = result;
    dashCacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: `Failed to load dashboard: ${error.message}` }, { status: 500 });
  }
}
