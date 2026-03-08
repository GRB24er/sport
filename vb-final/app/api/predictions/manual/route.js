import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prediction from "@/models/Prediction";
import Notification from "@/models/Notification";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId, homeTeam, awayTeam, predictions: picks, analysis, adminNote, sendToAll } = await req.json();

    if (!homeTeam || !awayTeam || !picks || picks.length === 0) {
      return NextResponse.json({ error: "Match details and picks required" }, { status: 400 });
    }

    let targets = [];
    if (sendToAll) {
      targets = await User.find({ status: "approved" }).select("_id name");
    } else if (userId) {
      const user = await User.findById(userId).select("_id name");
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      targets = [user];
    } else {
      return NextResponse.json({ error: "Specify userId or sendToAll" }, { status: 400 });
    }

    const match = `${homeTeam} vs ${awayTeam}`;
    const formattedPicks = picks.filter(p => p.market && p.pick).map(p => ({
      market: p.market,
      pick: p.pick,
      confidence: parseInt(p.confidence) || Math.floor(Math.random() * 20) + 75,
      odd: parseFloat(p.odd) || 1.5,
    }));

    const totalOdd = parseFloat(formattedPicks.reduce((a, p) => a * p.odd, 1).toFixed(2));

    const created = [];
    for (const target of targets) {
      const pred = await Prediction.create({
        userId: target._id,
        type: "manual",
        homeTeam, awayTeam, match,
        predictions: formattedPicks,
        totalOdd,
        confidence: Math.floor(formattedPicks.reduce((a, p) => a + p.confidence, 0) / formattedPicks.length),
        analysis: analysis || "Admin expert prediction.",
        adminNote: adminNote || null,
        status: "delivered",
        createdBy: session.user.name,
      });
      created.push(pred);

      await Notification.create({
        type: "manual_prediction",
        message: `New prediction from admin: ${match} — Total odd: ${totalOdd}x`,
        forUserId: target._id,
      });
    }

    await Notification.create({
      type: "manual_prediction",
      message: `Manual prediction sent: ${match} → ${targets.length} user(s)`,
      forAdmin: true,
    });

    return NextResponse.json({ message: `Sent to ${targets.length} user(s)`, predictions: created });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send prediction" }, { status: 500 });
  }
}
