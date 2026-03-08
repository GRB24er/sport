import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, default: "" },
    status: { type: String, enum: ["uploaded", "processing", "analyzed", "failed"], default: "uploaded" },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prediction", default: null },
    originalName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Upload || mongoose.model("Upload", uploadSchema);
