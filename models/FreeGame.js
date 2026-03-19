import mongoose from "mongoose";

const freeGameSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Free Game" },
    content: { type: String, required: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.FreeGame || mongoose.model("FreeGame", freeGameSchema);
