import { NextRequest, NextResponse } from "next/server";
import { sanityWriteConfigured } from "../sanity-write-client";
import { processWhatsAppBusinessWebhookPayload } from "../webhook-processor";

/**
 * GET — Meta webhook verification handshake.
 * Meta sends hub.mode, hub.verify_token, hub.challenge as query params.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification failed", { mode, token });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Incoming webhooks from Meta (messages, statuses, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    if (!sanityWriteConfigured()) {
      console.error("[WhatsApp Webhook] No Sanity write token — cannot persist incoming messages");
      return NextResponse.json(
        { error: "Server misconfigured: SANITY_API_WRITE_TOKEN or SANITY_TOKEN missing" },
        { status: 503 },
      );
    }

    const body = await req.json();
    await processWhatsAppBusinessWebhookPayload(body);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const clientErr =
      /Body must be a JSON object|Expected object ===|Not a WhatsApp business account payload/i.test(msg);
    return NextResponse.json({ error: msg }, { status: clientErr ? 400 : 500 });
  }
}
