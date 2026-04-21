import { NextRequest, NextResponse } from "next/server";
import { waAccessToken } from "../../wa-env";

const GRAPH = `https://graph.facebook.com/v21.0`;

/**
 * Proxies WhatsApp Cloud media: resolves Graph media id → binary (token kept server-side).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ mediaId: string }> }
) {
  const WA_TOKEN = waAccessToken();
  if (!WA_TOKEN) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { mediaId: rawId } = await context.params;
  const mediaId = decodeURIComponent(rawId || "");
  if (!mediaId || mediaId.length > 512 || mediaId.includes("..")) {
    return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
  }

  try {
    const metaRes = await fetch(`${GRAPH}/${encodeURIComponent(mediaId)}`, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });

    const meta = await metaRes.json();
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: meta?.error?.message || "Meta error" },
        { status: metaRes.status }
      );
    }

    const url = meta?.url as string | undefined;
    const mime = (meta?.mime_type as string) || "application/octet-stream";
    if (!url) {
      return NextResponse.json({ error: "No media URL" }, { status: 502 });
    }

    const binRes = await fetch(url, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });

    if (!binRes.ok) {
      return NextResponse.json(
        { error: "Download failed" },
        { status: binRes.status }
      );
    }

    const buf = await binRes.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    console.error("[WhatsApp Media Proxy]", e);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
