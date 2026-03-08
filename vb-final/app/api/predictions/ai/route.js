import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prediction from "@/models/Prediction";
import Upload from "@/models/Upload";
import Notification from "@/models/Notification";
import { generateAIPrediction, getPackageById } from "@/lib/utils";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { imageBase64, imageName } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Screenshot is required" }, { status: 400 });
    }

    // Get user
    const user = await User.findById(session.user.id);
    if (!user || user.status !== "approved") {
      return NextResponse.json({ error: "Account not active" }, { status: 403 });
    }

    // ── SUBSCRIPTION LOCK CHECK ──
    const pkg = getPackageById(user.package);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    if (user.predictionsUsed >= pkg.maxPredictions) {
      const nextPkg = pkg.nextPackage ? getPackageById(pkg.nextPackage) : null;
      return NextResponse.json({
        error: "LOCKED",
        message: `You've used all ${pkg.maxPredictions} prediction(s) on your ${pkg.name} plan.`,
        nextPackage: nextPkg ? { id: nextPkg.id, name: nextPkg.name, price: nextPkg.priceGHS } : null,
        currentPackage: pkg.id,
      }, { status: 429 });
    }

    // Save upload
    const upload = await Upload.create({
      userId: user._id,
      imageUrl: imageBase64.substring(0, 200) + "...",
      status: "processing",
      originalName: imageName || "screenshot.png",
    });

    // Generate AI prediction
    const predData = generateAIPrediction();

    const prediction = await Prediction.create({
      userId: user._id,
      type: "ai",
      homeTeam: predData.homeTeam,
      awayTeam: predData.awayTeam,
      match: predData.match,
      predictions: predData.predictions,
      totalOdd: predData.totalOdd,
      confidence: predData.confidence,
      analysis: predData.analysis,
      status: "delivered",
      uploadId: upload._id,
    });

    // Update upload
    upload.status = "analyzed";
    upload.predictionId = prediction._id;
    await upload.save();

    // ── INCREMENT PREDICTION COUNT ──
    user.predictionsUsed += 1;
    await user.save();

    // Check if now locked
    const nowLocked = user.predictionsUsed >= pkg.maxPredictions;

    // Notify admin
    await Notification.create({
      type: "prediction_request",
      message: `${user.name} (${user.phone}) used AI prediction ${user.predictionsUsed}/${pkg.maxPredictions} — ${prediction.match}`,
      forAdmin: true,
      relatedUserId: user._id,
      metadata: { predictionId: prediction._id, locked: nowLocked },
    });

    // Notify user
    await Notification.create({
      type: "prediction_delivered",
      message: `Your AI prediction for ${prediction.match} is ready! Total odd: ${prediction.totalOdd}x. ${nowLocked ? `You've used all predictions on ${pkg.name}. Upgrade to continue.` : `${pkg.maxPredictions - user.predictionsUsed} prediction(s) remaining.`}`,
      forUserId: user._id,
    });

    return NextResponse.json({
      prediction,
      predictionsUsed: user.predictionsUsed,
      maxPredictions: pkg.maxPredictions,
      locked: nowLocked,
    });
  } catch (error) {
    console.error("AI Prediction error:", error);
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
  }
}
