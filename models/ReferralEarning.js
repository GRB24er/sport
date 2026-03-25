import mongoose from "mongoose";

const ReferralEarningSchema = new mongoose.Schema({
  // The referrer who earns
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // The referred user who made the payment
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // What triggered the earning
  type: { type: String, enum: ["signup", "package"], required: true },
  // Package details (null for signup)
  gameId: { type: String, default: null },
  packageId: { type: String, default: null },
  // Amount the referred user paid
  amountPaid: { type: Number, required: true },
  // Amount earned by referrer
  amountEarned: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

ReferralEarningSchema.index({ referrerId: 1, createdAt: -1 });

export default mongoose.models.ReferralEarning || mongoose.model("ReferralEarning", ReferralEarningSchema);
