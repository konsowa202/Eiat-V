import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
});

function sanityReady(): boolean {
  return Boolean((process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN)?.trim());
}

function safeConversationIdFromWamid(wamid: string): string {
  const safe = (wamid || "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `wa_conv_${safe || Date.now()}`;
}

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
    if (!sanityReady()) {
      console.error("[WhatsApp Webhook] SANITY_API_WRITE_TOKEN is not set — cannot persist incoming messages");
      return NextResponse.json(
        { error: "Server misconfigured: SANITY_API_WRITE_TOKEN missing" },
        { status: 503 }
      );
    }

    const body = await req.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 400 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;

        // --- Handle incoming messages ---
        if (value.messages) {
          for (const msg of value.messages) {
            const contact = value.contacts?.find(
              (c: { wa_id: string }) => c.wa_id === msg.from
            );
            const senderName = contact?.profile?.name || "غير معروف";
            const phoneNumber = `+${msg.from}`;

            let messageBody = "";
            let messageKind = "text";
            let waMediaId: string | undefined;

            if (msg.type === "text") {
              messageBody = msg.text?.body || "";
              messageKind = "text";
            } else if (msg.type === "image") {
              messageBody = (msg.image?.caption || "").trim() || "[صورة]";
              messageKind = "image";
              waMediaId = msg.image?.id;
            } else if (msg.type === "document") {
              messageBody = `[مستند] ${msg.document?.filename || ""}`.trim();
              messageKind = "document";
              waMediaId = msg.document?.id;
            } else if (msg.type === "audio") {
              messageBody = "[رسالة صوتية]";
              messageKind = "audio";
              waMediaId = msg.audio?.id;
            } else if (msg.type === "video") {
              messageBody = "[فيديو]";
              messageKind = "video";
              waMediaId = msg.video?.id;
            } else if (msg.type === "location") {
              messageBody = `[موقع] ${msg.location?.latitude}, ${msg.location?.longitude}`;
              messageKind = "unknown";
            } else if (msg.type === "button") {
              messageBody = msg.button?.text || "[زر]";
              messageKind = "unknown";
            } else if (msg.type === "interactive") {
              messageBody =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                "[تفاعلي]";
              messageKind = "unknown";
            } else {
              messageBody = `[${msg.type}]`;
              messageKind = "unknown";
            }

            try {
              const docId = safeConversationIdFromWamid(String(msg.id || ""));
              await sanity.createOrReplace({
                _id: docId,
                _type: "whatsappConversation",
                patientName: senderName,
                phoneNumber,
                messageBody,
                templateUsed: "رسالة واردة",
                status: "sent",
                direction: "incoming",
                messageKind,
                ...(waMediaId ? { waMediaId } : {}),
                wamid: msg.id,
                sentAt: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              });
            } catch (createErr) {
              console.error("[WhatsApp Webhook] sanity.create failed for incoming message:", createErr);
              continue;
            }

            console.log(`[WhatsApp] Incoming from ${phoneNumber}: ${messageBody.substring(0, 50)}`);
          }
        }

        // --- Handle message status updates ---
        if (value.statuses) {
          for (const st of value.statuses) {
            const statusMap: Record<string, string> = {
              sent: "sent",
              delivered: "delivered",
              read: "read",
              failed: "failed",
            };

            const newStatus = statusMap[st.status];
            if (!newStatus) continue;

            const existing = await sanity.fetch<{ _id: string }[]>(
              `*[_type == "whatsappConversation" && wamid == $wamid][0..0]{ _id }`,
              { wamid: st.id }
            );

            if (existing?.length > 0) {
              await sanity
                .patch(existing[0]._id)
                .set({
                  status: newStatus,
                  ...(st.status === "failed"
                    ? {
                        errorMessage:
                          st.errors?.[0]?.title || st.errors?.[0]?.message || "فشل الإرسال",
                      }
                    : {}),
                })
                .commit();

              console.log(`[WhatsApp] Status update: ${st.id} → ${newStatus}`);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
