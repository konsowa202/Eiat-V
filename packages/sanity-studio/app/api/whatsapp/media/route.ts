import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy / mistaken URL: `/api/whatsapp/media?mediaId=…` (404 before).
 * The real handler is `/api/whatsapp/media/[mediaId]`. Redirect so old links work.
 */
export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("mediaId")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Use /api/whatsapp/media/{mediaId} or ?mediaId=" }, { status: 400 });
  }
  const target = new URL(req.url);
  target.pathname = `/api/whatsapp/media/${encodeURIComponent(id)}`;
  target.search = "";
  return NextResponse.redirect(target, 307);
}
