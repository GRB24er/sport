import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "payment",
        "approval",
        "rejection",
        "prediction_request",
        "prediction_delivered",
        "manual_prediction",
        "referral",
        "system",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Who this notification is for
    forAdmin: {
      type: Boolean,
      default: false,
    },
    forUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Related user (e.g., who made the payment)
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Read status
    read: {
      type: Boolean,
      default: false,
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ forAdmin: 1, read: 1, createdAt: -1 });
notificationSchema.index({ forUserId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
