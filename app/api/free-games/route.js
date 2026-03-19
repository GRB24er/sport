export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import FreeGame from "@/models/FreeGame";

// GET — anyone can fetch published free games; admin sees all
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";
    const filter = isAdmin ? {} : { published: true };
    const games = await FreeGame.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ freeGames: games });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — admin creates/updates free game
export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, content, published } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });
    const fg = await FreeGame.create({
      title: title?.trim() || "Free Game",
      content: content.trim(),
      published: !!published,
      publishedAt: published ? new Date() : null,
    });
    return NextResponse.json({ freeGame: fg });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — admin updates existing free game (publish/unpublish/edit)
export async function PATCH(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, title, content, published } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const fg = await FreeGame.findById(id);
    if (!fg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (title !== undefined) fg.title = title.trim();
    if (content !== undefined) fg.content = content.trim();
    if (published !== undefined) {
      fg.published = published;
      if (published && !fg.publishedAt) fg.publishedAt = new Date();
      if (!published) fg.publishedAt = null;
    }
    await fg.save();
    return NextResponse.json({ freeGame: fg });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — admin deletes free game
export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await FreeGame.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
