import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set");
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Connection pool — reuse connections across requests
      maxPoolSize: 10,
      // Don't wait forever for slow connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then(m => m);
  }
  try { cached.conn = await cached.promise; } catch (e) { cached.promise = null; throw e; }
  return cached.conn;
}
export default connectDB;
