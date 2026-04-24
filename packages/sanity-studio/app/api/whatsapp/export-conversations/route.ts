import { jsonCors, emptyCors } from "../studio-cors";
import { sanityWriteConfigured, withSanityWriteClient } from "../sanity-write-client";

const PAGE = 500;

export function OPTIONS() {
  return emptyCors(204);
}

/**
 * JSON export of `whatsappConversation` from Sanity (server-side).
 * WhatsApp Cloud API does not expose a full chat-history download; this is the recoverable archive from your dataset.
 */
export async function GET() {
  if (!sanityWriteConfigured()) {
    return jsonCors({ ok: false, error: "Sanity write token not configured (SANITY_API_WRITE_TOKEN / SANITY_TOKEN)." }, { status: 503 });
  }

  try {
    const rows = await withSanityWriteClient(async (client) => {
      const out: unknown[] = [];
      let offset = 0;
      for (;;) {
        const hi = offset + PAGE - 1;
        const batch = await client.fetch<
          Array<{
            _id: string;
            patientName?: string;
            phoneNumber?: string;
            messageBody?: string;
            templateUsed?: string;
            status?: string;
            direction?: string;
            wamid?: string;
            sentAt?: string;
            errorMessage?: string;
            messageKind?: string;
            waMediaId?: string;
          }>
        >(
          `*[_type == "whatsappConversation"] | order(sentAt desc) [${offset}..${hi}] {
            _id,
            patientName,
            phoneNumber,
            messageBody,
            templateUsed,
            status,
            direction,
            wamid,
            sentAt,
            errorMessage,
            messageKind,
            waMediaId
          }`,
        );
        if (!batch?.length) break;
        out.push(...batch);
        if (batch.length < PAGE) break;
        offset += PAGE;
      }
      return out;
    });

    return jsonCors({
      ok: true,
      exportedAt: new Date().toISOString(),
      count: rows.length,
      noteAr:
        "هذا التصدير من Sanity فقط. واجهة WhatsApp Cloud API من Meta لا توفر سحب تاريخ المحادثات الكامل من الخادم؛ الرسائل الواردة تعتمد على Webhook.",
      conversations: rows,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Export failed";
    return jsonCors({ ok: false, error: msg }, { status: 500 });
  }
}
