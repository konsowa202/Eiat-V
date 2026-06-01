import { withSanityWriteClient } from "./sanity-write-client";
import { randomUUID } from "crypto";

export type ProcessWebhookResult = {
  incomingUpserts: number;
  statusPatches: number;
};

/**
 * Same persistence rules as POST /api/whatsapp/webhook (incoming messages + outbound status patches).
 * Used by the live webhook and by optional manual replay when you have the raw Meta JSON.
 */
export async function processWhatsAppBusinessWebhookPayload(body: unknown): Promise<ProcessWebhookResult> {
  if (!body || typeof body !== "object") {
    throw new Error("Body must be a JSON object");
  }
  const root = body as { object?: string; entry?: unknown[] };
  if (root.object !== "whatsapp_business_account") {
    throw new Error('Expected object === "whatsapp_business_account"');
  }

  let incomingUpserts = 0;
  let statusPatches = 0;

  for (const entry of root.entry || []) {
    const ent = entry as { changes?: unknown[] };
    for (const change of ent.changes || []) {
      const ch = change as { field?: string; value?: Record<string, unknown> };
      if (ch.field !== "messages") continue;
      const value = ch.value || {};

      const messages = value.messages as unknown[] | undefined;
      if (messages?.length) {
        for (const raw of messages) {
          const msg = raw as {
            id?: string;
            from?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
            image?: { caption?: string; id?: string };
            document?: { filename?: string; id?: string };
            audio?: { id?: string };
            video?: { id?: string };
            reaction?: { emoji?: string; message_id?: string };
            location?: { latitude?: number; longitude?: number };
            button?: { text?: string };
            interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
          };

          const contacts = value.contacts as { wa_id?: string; profile?: { name?: string } }[] | undefined;
          const contact = contacts?.find((c) => c.wa_id === msg.from);
          const senderName = contact?.profile?.name || "غير معروف";
          const phoneNumber = msg.from ? `+${msg.from}` : "";
          const phoneDigits = phoneNumber.replace(/\D/g, "");

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
          } else if (msg.type === "sticker") {
            messageBody = "[ملصق]";
            messageKind = "sticker";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            waMediaId = (msg as Record<string, {id?: string}>).sticker?.id;
          } else if (msg.type === "reaction") {
            const emoji = (msg.reaction?.emoji || "").trim();
            const target = (msg.reaction?.message_id || "").trim();
            messageBody = emoji
              ? `تفاعل على رسالة: ${emoji}${target ? ` (${target.slice(-8)})` : ""}`
              : "[تفاعل]";
            messageKind = "text";
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
          } else if (msg.type === "unsupported") {
            messageBody = "[رسالة غير مدعومة أو إشعار نظام]";
            messageKind = "unknown";
          } else {
            messageBody = `[${msg.type || "unknown"}]`;
            messageKind = "unknown";
          }

          try {
            const threadId = `whatsappThread.${phoneDigits}`;
            const sentAt = (() => {
              const ts = parseInt(String(msg.timestamp), 10);
              return new Date(Number.isFinite(ts) ? ts * 1000 : Date.now()).toISOString();
            })();

            await withSanityWriteClient((client) =>
              client
                .transaction()
                .createIfNotExists({
                  _id: threadId,
                  _type: "whatsappThread",
                  phoneNumber,
                  patientName: senderName,
                  threadLabel: "جديد",
                  messages: [],
                })
                .patch(threadId, (p) =>
                  p
                    .set({ patientName: senderName, lastMessageAt: sentAt })
                    .append("messages", [
                      {
                        _key: randomUUID(),
                        messageBody,
                        direction: "incoming",
                        status: "sent",
                        messageKind,
                        ...(waMediaId ? { waMediaId } : {}),
                        templateUsed: "رسالة واردة",
                        wamid: msg.id,
                        sentAt,
                      },
                    ])
                )
                .commit({ autoGenerateArrayKeys: true })
            );
            incomingUpserts += 1;
          } catch (createErr) {
            console.error("[WhatsApp Webhook] sanity.patch failed for incoming message:", createErr);
          }
        }
      }

      const statuses = value.statuses as unknown[] | undefined;
      if (statuses?.length) {
        for (const raw of statuses) {
          const st = raw as {
            id?: string;
            status?: string;
            errors?: { title?: string; message?: string }[];
          };
          const statusMap: Record<string, string> = {
            sent: "sent",
            delivered: "delivered",
            read: "read",
            failed: "failed",
          };
          const newStatus = statusMap[String(st.status || "")];
          if (!newStatus) continue;

          await withSanityWriteClient(async (client) => {
            const existingThread = await client.fetch<{ _id: string, messages: Record<string, unknown>[] }>(
              `*[_type == "whatsappThread" && $wamid in messages[].wamid][0]{ _id, messages }`,
              { wamid: st.id }
            );

            if (existingThread && existingThread.messages) {
              const msgIndex = existingThread.messages.findIndex((m) => m.wamid === st.id);
              if (msgIndex !== -1) {
                const key = existingThread.messages[msgIndex]._key;
                const patchObj: Record<string, unknown> = {
                  [`messages[_key == "${key}"].status`]: newStatus,
                };
                if (st.status === "failed") {
                  patchObj[`messages[_key == "${key}"].errorMessage`] = 
                    st.errors?.[0]?.title || st.errors?.[0]?.message || "فشل الإرسال";
                }
                await client.patch(existingThread._id).set(patchObj).commit();
                statusPatches += 1;
              }
            }
          });
        }
      }
    }
  }

  return { incomingUpserts, statusPatches };
}
