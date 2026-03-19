import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";
  return NextResponse.json({ ip });
}
