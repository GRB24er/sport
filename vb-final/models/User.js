import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending" },

    // Package & Subscription
    package: { type: String, enum: ["gold", "platinum", "diamond"], required: true },

    // Prediction tracking — resets when user upgrades/renews
    predictionsUsed: { type: Number, default: 0 },

    // Payment
    referenceNumber: { type: String, required: true, trim: true },
    paymentProvider: { type: String, default: "" }, // mtn, telecel, airteltigo
    amountPaidGHS: { type: Number, default: 0 },

    // SportyBet
    sportyBetId: { type: String, trim: true },

    // Referral
    referralCode: { type: String, unique: true, trim: true },
    referredBy: { type: String, default: null, trim: true },

    // Avatar initials
    avatar: { type: String, default: "" },

    // Admin tracking
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate avatar
userSchema.pre("save", function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ phone: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
