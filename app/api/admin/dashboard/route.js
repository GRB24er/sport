export const dynamic = 'force-dynamic';
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

const PKG_PRICES_DEF = { gold: 250, platinum: 500, diamond: 1000 };
const PKG_NAMES = { gold: "Gold", platinum: "Platinum", diamond: "Diamond" };
const GAME_NAMES = { "instant-virtual": "Instant Virtual", "egames": "eGames" };
const PROV_NAMES = { mtn: "MTN MoMo", telecel: "Telecel Cash", airteltigo: "AirtelTigo" };

function mToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  if (typeof m.toJSON === "function") return m.toJSON();
  return typeof m === "object" ? { ...m } : {};
}

// Single consolidated endpoint — replaces 9 separate API calls
// One cold start, one DB connection, one session check, all queries in parallel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Run ALL queries in parallel — single DB connection
    const [
      users,
      uploads,
      rounds,
      notifications,
      usersWithCodes,
      allReferred,
      settings,
      broadcasts,
      supportThreads,
      pkgUsers,
    ] = await Promise.all([
      // 1. Users (limited to 200, no password)
      User.find({}).select("-password").sort({ createdAt: -1 }).limit(200).lean(),
      // 2. Uploads (latest 100)
      Upload.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      // 3. Rounds (latest 50)
      Round.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      // 4. Notifications (admin, latest 50)
      Notification.find({ forAdmin: true })
        .populate("relatedUserId", "name phone")
        .sort({ createdAt: -1 }).limit(50).lean(),
      // 5. Referral — users with codes
      User.find({ referralCode: { $ne: null } })
        .select("name phone referralCode referralBalance referralTotalEarned referralCount status package")
        .sort({ referralCount: -1 }).lean(),
      // 6. Referral — referred users
      User.find({ referredBy: { $ne: null } })
        .select("name phone referredBy status package createdAt")
        .sort({ createdAt: -1 }).lean(),
      // 7. Settings
      Settings.findOne({ key: "main" }).lean(),
      // 8. Broadcasts
      Broadcast.find().sort({ createdAt: -1 }).limit(50).lean(),
      // 9. Support threads (lightweight — just counts)
      SupportThread.find().sort({ lastDate: -1 }).lean(),
      // 10. Package requests — users with pending packages
      User.find({ "pendingGamePackages": { $exists: true, $ne: {} } })
        .select("name phone email sportyBetId pendingGamePackages").lean(),
    ]);

    // --- Process referral stats ---
    const totalBonusPaid = usersWithCodes.reduce((s, u) => s + (u.referralTotalEarned || 0), 0);
    const totalOutstanding = usersWithCodes.reduce((s, u) => s + (u.referralBalance || 0), 0);
    const totalReferrals = allReferred.length;
    const approvedReferrals = allReferred.filter(u => u.status === "approved").length;

    const referralData = {
      usersWithCodes,
      allReferred,
      stats: {
        totalReferrals,
        approvedReferrals,
        pendingReferrals: allReferred.filter(u => u.status === "pending").length,
        totalBonusPaid,
        totalOutstanding,
        conversionRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
      },
    };

    // --- Process support threads (enrich with user info from memory) ---
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
            senderName: r.senderName || "", date: r.date,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
