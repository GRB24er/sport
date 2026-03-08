import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // "broadcast" = admin → all users, "support" = user↔admin conversation
    type: { type: String, enum: ["broadcast", "support"], required: true },

    // For support: which user's conversation
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    // Who sent: "admin" or the user's ObjectId
    sender: { type: String, required: true },
    senderName: { type: String, default: "" },

    // Content
    subject: { type: String, default: "" },
    body: { type: String, required: true },

    // For support: tracking
    read: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },

    // For broadcast: track delivery
    recipientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

messageSchema.index({ type: 1, createdAt: -1 });
messageSchema.index({ userId: 1, type: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
