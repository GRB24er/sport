import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lastMessage: { type: String, default: "" },
  lastDate: { type: Date, default: Date.now },
  adminUnread: { type: Number, default: 0 },
  userUnread: { type: Number, default: 0 },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: "SupportThread", required: true, index: true },
  sender: { type: String, enum: ["user", "admin"], required: true },
  senderName: { type: String, default: "" },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const SupportThread = mongoose.models.SupportThread || mongoose.model("SupportThread", threadSchema);
export const SupportMessage = mongoose.models.SupportMessage || mongoose.model("SupportMessage", messageSchema);
