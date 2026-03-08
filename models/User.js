import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Per-game package: { package: "gold", predictionsUsed: 0 }
const gamePackageSchema = new mongoose.Schema({
  package: { type: String, enum: ["gold", "platinum", "diamond"], required: true },
  predictionsUsed: { type: Number, default: 0 },
  activatedAt: { type: Date, default: Date.now },
}, { _id: false });

// Pending request: { package: "gold", ref: "MTN-123", provider: "mtn", sender: "John", date: Date }
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
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending" },

    // Per-game active packages: { "instant-virtual": { package: "gold", predictionsUsed: 0 }, "egames": {...} }
    gamePackages: { type: Map, of: gamePackageSchema, default: {} },

    // Per-game pending requests: { "instant-virtual": { package: "gold", ref: "...", ... } }
    pendingGamePackages: { type: Map, of: pendingRequestSchema, default: {} },

    // Registration payment
    referenceNumber: { type: String, required: true, trim: true },
    paymentProvider: { type: String, default: "" },
    amountPaidGHS: { type: Number, default: 0 },

    // SportyBet
    sportyBetId: { type: String, trim: true },

    // Referral
    referralCode: { type: String, default: null, unique: true, sparse: true, trim: true },
    referredBy: { type: String, default: null, trim: true },
    referralBalance: { type: Number, default: 0 },
    referralTotalEarned: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },

    avatar: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

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
