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
// Prevents hammering DB on rapid refreshes or multiple admin tabs
let dashCache = null;
let dashCacheTime = 0;
const CACHE_TTL = 30 * 1000;

// Single consolidated endpoint — replaces 9 separate API calls
// One cold start, one DB connection, one session check, all queries in parallel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return cached response if fresh (within 30s)
    const now = Date.now();
    if (dashCache && (now - dashCacheTime) < CACHE_TTL) {
      return NextResponse.json(dashCache);
    }

    await connectDB();

    // Run ALL queries in parallel — single DB connection
    // Uses Promise.allSettled so one failing query doesn't crash the whole dashboard
    const results = await Promise.allSettled([
      // 1. Users — only fields the dashboard needs (skip password, avatar, etc.)
      // No limit — revenue and user list need ALL users
      User.find({})
        .select("name phone email status amountPaidGHS referredBy referralCode gamePackages pendingGamePackages sportyBetId referenceNumber paymentProvider createdAt approvedAt isBanned banReason bannedAt bannedUntil bannedIP lastLoginIP")
        .sort({ createdAt: -1 }).lean(),
      // 2. Uploads — EXCLUDE imageData (base64 screenshots are 500KB-2MB each!)
      Upload.find({})
        .select("-imageData")
        .sort({ createdAt: -1 }).limit(100).lean(),
      // 3. Rounds (latest 50)
      Round.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      // 4. Notifications (admin, latest 50)
      Notification.find({ forAdmin: true })
        .populate("relatedUserId", "name phone")
        .sort({ createdAt: -1 }).limit(50).lean(),
      // 5. Referral — users with codes
      User.find({ referralCode: { $ne: null } })
        .select("name phone referralCode referralBalance referralTotalEarned referralCount status")
        .sort({ referralCount: -1 }).lean(),
      // 6. Referral — referred users
      User.find({ referredBy: { $ne: null } })
        .select("name phone referredBy status createdAt")
        .sort({ createdAt: -1 }).lean(),
      // 7. Settings
      Settings.findOne({ key: "main" }).lean(),
      // 8. Broadcasts (latest 20 is enough for the list)
      Broadcast.find().sort({ createdAt: -1 }).limit(20).lean(),
      // 9. Support threads
      SupportThread.find().sort({ lastDate: -1 }).lean(),
      // 10. Package requests — users with pending packages
      User.find({ "pendingGamePackages": { $exists: true, $ne: {} } })
        .select("name phone email sportyBetId pendingGamePackages").lean(),
      // 11. Referral earnings log
      ReferralEarning.find({})
        .populate("referrerId", "name phone referralCode")
        .populate("referredUserId", "name phone")
        .sort({ createdAt: -1 }).limit(200).lean(),
    ]);

    // Extract values safely — failed queries return empty arrays/null instead of crashing
    const v = (i) => results[i].status === "fulfilled" ? results[i].value : null;

    // Debug: log any failed queries
    const failedQueries = results.map((r, i) => r.status === "rejected" ? { query: i, reason: r.reason?.message || String(r.reason) } : null).filter(Boolean);
    if (failedQueries.length > 0) console.error("Dashboard failed queries:", JSON.stringify(failedQueries));

    const users = v(0) || [];
    const uploads = v(1) || [];
    const rounds = v(2) || [];
    const notifications = v(3) || [];
    const usersWithCodes = v(4) || [];
    const allReferred = v(5) || [];
    const settings = v(6);
    const broadcasts = v(7) || [];
    const supportThreads = v(8) || [];
    const pkgUsers = v(9) || [];
    const allEarnings = v(10) || [];

    // --- Process referral stats ---
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

    // --- Process support threads (enrich with user info already in memory) ---
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const enrichedThreads = supportThreads.map(t => {
      const u = userMap[t.userId?.toString()];
      return {
        ...t,
        user: u ? { name: u.name, phone: u.phone, email: u.email } : null,
        unread: t.adminUnread || 0,
      };
    });
    const totalUnread = enrichedThreads.reduce((s, t) => s + (t.unread || 0), 0);

    // --- Process package requests ---
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

    // --- Notification unread count ---
    const unreadCount = notifications.filter(n => !n.read).length;

    // --- Settings fallback ---
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
      _debug: { userCount: users.length, failedQueries },
      uploads,
      rounds,
      notifications,
      unreadCount,
      referralData,
      settings: settingsObj,
      broadcasts,
      support: { threads: enrichedThreads, totalUnread },
      packageRequests: requests,
    };

    // Cache result for 30 seconds
    dashCache = result;
    dashCacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: `Failed to load dashboard: ${error.message}` }, { status: 500 });
  }
}
