import { NextRequest } from "next/server";
import { jsonCors, emptyCors } from "../studio-cors";
import { sanityWriteConfigured } from "../sanity-write-client";
import { processWhatsAppBusinessWebhookPayload } from "../webhook-processor";

export function OPTIONS() {
  return emptyCors(204);
}

type ReplayBody = {
  /** Must match server env WHATSAPP_WEBHOOK_REPLAY_TOKEN (long random string). */
  replayToken?: string;
  /** Raw Meta webhook JSON (same shape as POST /api/whatsapp/webhook). */
  payload?: unknown;
};

/**
 * Re-run webhook persistence against Sanity when Meta (or your logs) still have the JSON
 * but the original POST failed (e.g. Sanity down / 403). Meta does not expose an "inbox sync" API.
 */
export async function POST(req: NextRequest) {
  const expected = (process.env.WHATSAPP_WEBHOOK_REPLAY_TOKEN || "").trim();
  if (!expected) {
    return jsonCors(
      {
        ok: false,
        error:
          "WHATSAPP_WEBHOOK_REPLAY_TOKEN is not set on the server. Add a long random secret in Vercel env, redeploy, then use the same value here.",
      },
      { status: 503 },
    );
  }

  if (!sanityWriteConfigured()) {
    return jsonCors(
      { ok: false, error: "Sanity write token missing (SANITY_API_WRITE_TOKEN / SANITY_TOKEN)." },
      { status: 503 },
    );
  }

  let body: ReplayBody;
  try {
    body = (await req.json()) as ReplayBody;
  } catch {
    return jsonCors({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const token = (body.replayToken || "").trim();
  if (!token || token !== expected) {
    return jsonCors({ ok: false, error: "Invalid or missing replayToken" }, { status: 403 });
  }

  if (body.payload === undefined || body.payload === null) {
    return jsonCors({ ok: false, error: "Missing payload" }, { status: 400 });
  }

  try {
    const { incomingUpserts, statusPatches } = await processWhatsAppBusinessWebhookPayload(body.payload);
    return jsonCors({
      ok: true,
      incomingUpserts,
      statusPatches,
      messageAr: `تمت المعالجة: ${incomingUpserts} رسالة واردة (إنشاء/تحديث)، ${statusPatches} تحديث حالة للرسائل الصادرة الموجودة مسبقًا في Sanity.`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({ ok: false, error: msg }, { status: 400 });
  }
}
