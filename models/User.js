import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const gamePackageSchema = new mongoose.Schema({
  package: { type: String, enum: ["gold", "platinum", "diamond"], required: true },
  predictionsUsed: { type: Number, default: 0 },
  activatedAt: { type: Date, default: Date.now },
}, { _id: false });

const pendingRequestSchema = new mongoose.Schema({
  package: { type: String, enum: ["gold", "platinum", "diamond"], required: true },
  referenceNumber: { type: String, required: true },
  paymentProvider: { type: String, required: true },
  senderName: { type: String, default: "" },
  date: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, required: true, trim: true, lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending" },

    gamePackages: { type: Map, of: gamePackageSchema, default: {} },
    pendingGamePackages: { type: Map, of: pendingRequestSchema, default: {} },

    referenceNumber: { type: String, required: true, trim: true },
    paymentProvider: { type: String, default: "" },
    amountPaidGHS: { type: Number, default: 0 },

    sportyBetId: { type: String, trim: true },

    referralCode: { type: String, default: null, trim: true },
    referredBy: { type: String, default: null, trim: true },
    referralBalance: { type: Number, default: 0 },
    referralTotalEarned: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },

    // Ban system
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    bannedAt: { type: Date, default: null },
    bannedUntil: { type: Date, default: null }, // null = permanent
    bannedBy: { type: String, default: null },
    bannedIP: { type: String, default: null },
    lastLoginIP: { type: String, default: null },

    // Payment screenshot for signup
    paymentScreenshot: { type: String, default: "" }, // base64

    avatar: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// === DATABASE INDEXES for fast queries ===
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ referralCode: 1 }, { sparse: true });
userSchema.index({ referredBy: 1 }, { sparse: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
