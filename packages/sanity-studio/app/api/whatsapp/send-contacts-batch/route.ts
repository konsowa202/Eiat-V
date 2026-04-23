import {NextRequest} from "next/server";
import {createClient} from "@sanity/client";
import {jsonCors, emptyCors} from "../studio-cors";

function requestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
});

type ContactRow = {
  _id: string;
  name?: string;
  phoneE164: string;
  status?: string;
  tags?: string[];
};

export function OPTIONS() {
  return emptyCors();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      templateUsed?: string;
      templateParams?: Record<string, string>;
      cursor?: number;
      batchSize?: number;
      tag?: string;
    };

    const message = String(body.message || "").trim();
    if (!message) return jsonCors({success: false, error: "message missing"}, {status: 400});
    const templateUsed = String(body.templateUsed || "Broadcast").trim() || "Broadcast";
    const templateParams = body.templateParams || {};
    const cursor = Math.max(0, Number(body.cursor) || 0);
    const batchSize = Math.min(1000, Math.max(50, Number(body.batchSize) || 250));
    const tag = String(body.tag || "").trim();

    const start = cursor;
    const end = cursor + batchSize;

    let contacts: ContactRow[] = [];
    let total = 0;
    if (tag) {
      const tagLiteral = JSON.stringify(tag);
      contacts = await sanity.fetch<ContactRow[]>(
        `*[_type == "whatsappContact" && status == "active" && ${tagLiteral} in tags] | order(_id asc)[${start}...${end}]{_id, name, phoneE164, status, tags}`,
      );
      total = await sanity.fetch<number>(
        `count(*[_type == "whatsappContact" && status == "active" && ${tagLiteral} in tags])`,
      );
    } else {
      contacts = await sanity.fetch<ContactRow[]>(
        `*[_type == "whatsappContact" && status == "active"] | order(_id asc)[${start}...${end}]{_id, name, phoneE164, status, tags}`,
      );
      total = await sanity.fetch<number>(`count(*[_type == "whatsappContact" && status == "active"])`);
    }

    if (!contacts.length) {
      return jsonCors({
        success: true,
        sent: 0,
        failed: 0,
        processed: 0,
        nextCursor: cursor,
        done: true,
        total,
      });
    }

    const origin = requestOrigin(req);
    const sendUrl = `${origin}/api/whatsapp/send`;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      try {
        const res = await fetch(sendUrl, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            phone: c.phoneE164,
            message,
            patientName: (c.name || "").trim() || "عميل",
            templateUsed,
            templateParams: {
              ...templateParams,
              patientName: (c.name || "").trim() || templateParams.patientName || "عميلنا العزيز",
            },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {success?: boolean};
        if (data.success) sent += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
      if (i < contacts.length - 1) await new Promise((r) => setTimeout(r, 85));
    }

    const processed = contacts.length;
    const nextCursor = cursor + processed;
    const done = nextCursor >= total;

    return jsonCors({
      success: true,
      sent,
      failed,
      processed,
      nextCursor,
      done,
      total,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({success: false, error: msg}, {status: 500});
  }
}
