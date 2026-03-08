import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["payment", "approval", "rejection", "prediction_request", "prediction_delivered", "manual_prediction", "referral", "upgrade", "system"],
      required: true,
    },
    message: { type: String, required: true },
    forAdmin: { type: Boolean, default: false },
    forUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ forAdmin: 1, read: 1, createdAt: -1 });
notificationSchema.index({ forUserId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
