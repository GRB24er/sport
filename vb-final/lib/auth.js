import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./mongodb";
import User from "../models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone and password are required");
        }

        // ── Admin check ──
        if (
          credentials.phone === process.env.ADMIN_PHONE &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "admin",
            phone: process.env.ADMIN_PHONE,
            name: process.env.ADMIN_NAME || "Admin",
            role: "admin",
          };
        }

        // ── Regular user ──
        await connectDB();

        const user = await User.findOne({ phone: credentials.phone }).select("+password");

        if (!user) {
          throw new Error("Invalid phone number or password");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isMatch) {
          throw new Error("Invalid phone number or password");
        }

        // ── Payment wall — block pending/rejected/suspended ──
        if (user.status === "pending") {
          throw new Error("Account pending — Admin is verifying your payment. Please wait.");
        }
        if (user.status === "rejected") {
          throw new Error("Account rejected. Contact support.");
        }
        if (user.status === "suspended") {
          throw new Error("Account suspended. Contact admin.");
        }

        return {
          id: user._id.toString(),
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: "user",
          package: user.package,
          referralCode: user.referralCode,
          sportyBetId: user.sportyBetId,
          status: user.status,
          predictionsUsed: user.predictionsUsed,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = user.role;
        token.package = user.package;
        token.referralCode = user.referralCode;
        token.sportyBetId = user.sportyBetId;
        token.status = user.status;
        token.predictionsUsed = user.predictionsUsed;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.phone = token.phone;
      session.user.role = token.role;
      session.user.package = token.package;
      session.user.referralCode = token.referralCode;
      session.user.sportyBetId = token.sportyBetId;
      session.user.status = token.status;
      session.user.predictionsUsed = token.predictionsUsed;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
