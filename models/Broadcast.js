import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  sentTo: { type: Number, default: 0 },
  sentBy: { type: String, default: "Admin" },
}, { timestamps: true });

export default mongoose.models.Broadcast || mongoose.model("Broadcast", broadcastSchema);
