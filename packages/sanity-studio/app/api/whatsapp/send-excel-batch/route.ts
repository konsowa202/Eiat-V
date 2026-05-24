import {NextRequest} from "next/server";
import {jsonCors, emptyCors} from "../studio-cors";

function requestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function OPTIONS() {
  return emptyCors();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      targets: { name?: string; phoneE164: string }[];
      message?: string;
      templateUsed?: string;
      templateParams?: Record<string, string>;
      metaTemplate?: Record<string, unknown>;
    };

    const targets = body.targets || [];
    if (!targets.length) {
      return jsonCors({ success: true, sent: 0, failed: 0, processed: 0 });
    }

    const message = String(body.message || "").trim();
    if (!message && !body.metaTemplate) {
      return jsonCors({success: false, error: "message missing"}, {status: 400});
    }

    const templateUsed = String(body.templateUsed || "Excel Broadcast").trim() || "Excel Broadcast";
    const templateParams = body.templateParams || {};
    const metaTemplate = body.metaTemplate;

    const origin = requestOrigin(req);
    const sendUrl = `${origin}/api/whatsapp/send`;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
      const c = targets[i];
      try {
        const res = await fetch(sendUrl, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            phone: c.phoneE164,
            message,
            templateUsed,
            templateParams: {
              ...templateParams,
              patientName: c.name || "العميل الكريم",
            },
            metaTemplate,
          }),
        });

        if (res.ok) {
          const d = await res.json();
          if (d.success) {
            sent++;
          } else {
            console.error(`Error sending to ${c.phoneE164}:`, d.error);
            failed++;
          }
        } else {
          console.error(`HTTP Error sending to ${c.phoneE164}:`, res.status);
          failed++;
        }
      } catch (err) {
        console.error(`Exception sending to ${c.phoneE164}:`, err);
        failed++;
      }
    }

    return jsonCors({
      success: true,
      sent,
      failed,
      processed: targets.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({success: false, error: msg}, {status: 500});
  }
}
