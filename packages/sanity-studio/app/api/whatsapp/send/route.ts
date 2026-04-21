import { NextRequest } from "next/server";
import { jsonCors, emptyCors } from "../studio-cors";
import { createClient } from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url";
import { waAccessToken, waPhoneNumberId } from "../wa-env";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
});

const WA_PHONE_ID = waPhoneNumberId();
const WA_TOKEN = waAccessToken();
const GRAPH = "https://graph.facebook.com/v21.0";

// Meta-hosted Media ID for the clinic logo (Permanent and reliable)
const LOGO_MEDIA_ID = "890336857379800";

const imageBuilder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
});

type MetaHeaderFormat = "NONE" | "IMAGE" | "TEXT" | "VIDEO" | "DOCUMENT";

export type MetaTemplateSendPayload = {
  name: string;
  languageCode: string;
  bodyParameterValues?: string[];
  headerFormat?: MetaHeaderFormat;
  /** Public HTTPS image URL (e.g. cdn.sanity.io) — Meta accepts `image.link`. */
  headerImageLink?: string;
  /** Sanity image asset `_ref` (e.g. image-abc-def-png) — converted server-side to CDN URL. */
  headerImageSanityRef?: string;
};

const META_TEMPLATES_CONFIG: Record<string, { name: string; bodyParams: number; hasHeaderImage?: boolean }> = {
  // Finalized mapping from visual inspection
  "قالب فيسبوك: eiat (Marketing)": { name: "eiat", bodyParams: 0, hasHeaderImage: true },
  "قالب فيسبوك: eiat1 (Utility)": { name: "eiat1", bodyParams: 1, hasHeaderImage: true },
  "قالب فيسبوك: تأكيد موعد (confirmation)": { name: "confirmation", bodyParams: 4, hasHeaderImage: false },
  "قالب اختبار بدون متغيرات": { name: "open", bodyParams: 0, hasHeaderImage: false },
  /** Meta / Business Suite default English label for the same template */
  "re-engagement message": { name: "open", bodyParams: 0, hasHeaderImage: false },

  // Direct mappings
  eiat: { name: "eiat", bodyParams: 0, hasHeaderImage: true },
  eiat1: { name: "eiat1", bodyParams: 1, hasHeaderImage: true },
  confirmation: { name: "confirmation", bodyParams: 4, hasHeaderImage: false },
  open: { name: "open", bodyParams: 0, hasHeaderImage: false },
};

const OPEN_EN_LABEL_LINE =
  /^[\s\u00a0\u200c-\u200f]*re[-\s]?engagement\s+message[\s\u00a0\u200c-\u200f]*$/i;

/** Meta Graph may put the suite label as BODY text or on its own line after Arabic (template `open`). */
function normalizeMetaSanityMessagePreview(graphTemplateName: string, messageTrim: string): string {
  if (graphTemplateName !== "open" || !messageTrim) return messageTrim;
  const ar = "قالب اختبار بدون متغيرات";
  return messageTrim
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split(/\n/)
        .map((line) => (OPEN_EN_LABEL_LINE.test(line) ? ar : line))
        .join("\n"),
    )
    .join("\n\n");
}

function normalizeWaNumber(raw: string): string {
  let num = (raw || "").trim();
  num = num.replace(/[^\d+]/g, "");
  if (num.startsWith("00")) num = num.slice(2);
  if (num.startsWith("+")) num = num.slice(1);
  return num;
}

function resolveHeaderImageHttps(meta: MetaTemplateSendPayload): string | null {
  const link = (meta.headerImageLink || "").trim();
  if (link && /^https:\/\//i.test(link)) return link;

  const ref = (meta.headerImageSanityRef || "").trim();
  if (ref.startsWith("image-") && !ref.includes("/")) {
    try {
      return imageBuilder.image({_ref: ref}).width(1600).auto("format").url();
    } catch {
      return null;
    }
  }
  if (link.startsWith("image-") && !link.includes("/")) {
    try {
      return imageBuilder.image({_ref: link}).width(1600).auto("format").url();
    } catch {
      return null;
    }
  }
  return null;
}

function buildMetaTemplatePayload(num: string, meta: MetaTemplateSendPayload): { payload: Record<string, unknown>; graphName: string } {
  const graphName = meta.name.trim();
  const languageCode = (meta.languageCode || "ar").trim();
  const vals = (meta.bodyParameterValues || []).map((v) => String(v ?? ""));
  const headerFormat: MetaHeaderFormat = meta.headerFormat || "NONE";

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: num,
    type: "template",
    template: {
      name: graphName,
      language: { code: languageCode },
    },
  };

  const components: Array<Record<string, unknown>> = [];

  if (headerFormat === "IMAGE") {
    const httpsUrl = resolveHeaderImageHttps(meta);
    if (httpsUrl) {
      components.push({
        type: "header",
        parameters: [{ type: "image", image: { link: httpsUrl } }],
      });
    } else {
      components.push({
        type: "header",
        parameters: [{ type: "image", image: { id: LOGO_MEDIA_ID } }],
      });
    }
  }

  if (vals.length > 0) {
    components.push({
      type: "body",
      parameters: vals.map((text) => ({ type: "text", text })),
    });
  }

  if (components.length > 0) {
    (payload.template as { components?: unknown[] }).components = components;
  }

  return { payload, graphName };
}

export function OPTIONS() {
  return emptyCors();
}

export async function POST(req: NextRequest) {
  if (!WA_TOKEN) return jsonCors({ success: false, error: "Token missing" }, { status: 500 });

  try {
    const {
      phone,
      message,
      patientName,
      templateUsed,
      templateParams,
      metaTemplate,
    }: {
      phone?: string;
      message?: string;
      patientName?: string;
      templateUsed?: string;
      templateParams?: Record<string, string>;
      metaTemplate?: MetaTemplateSendPayload;
    } = await req.json();

    if (!phone?.trim()) return jsonCors({ success: false, error: "phone missing" }, { status: 400 });

    const num = normalizeWaNumber(phone);
    if (!num) return jsonCors({ success: false, error: "invalid phone" }, { status: 400 });

    console.log("[WA send] POST", {
      hasMetaTemplate: Boolean(metaTemplate?.name?.trim()),
      template: metaTemplate?.name?.trim() || (templateUsed || "").slice(0, 40),
      phoneDigits: num.length,
    });

    let payload: Record<string, unknown>;
    let config: { name: string; bodyParams: number; hasHeaderImage?: boolean } | null = null;
    let graphTemplateName = "";

    // ——— Explicit Meta template (from Studio «إرسال قالب فيسبوك») ———
    if (metaTemplate?.name?.trim()) {
      const built = buildMetaTemplatePayload(num, metaTemplate);
      payload = built.payload;
      graphTemplateName = built.graphName;
      try {
        const safeLog = JSON.stringify(built.payload, null, 0).slice(0, 4000);
        console.log("[WA send] meta template payload (truncated):", safeLog);
      } catch {
        /* ignore */
      }
    } else {
      const tplNormal = (templateUsed || "").trim().toLowerCase();
      const messageNorm = (message || "").trim().toLowerCase();
      /** Match Meta keys against Sanity template name *or* message body (names often differ, e.g. "Re-engagement message"). */
      const haystack = `${tplNormal} ${messageNorm}`.trim();

      // Fuzzy matching + Forced Template Logic (legacy Sanity names)
      const matchedKey = Object.keys(META_TEMPLATES_CONFIG).find((k) => {
        const kl = k.toLowerCase();
        return haystack.includes(kl) || kl.includes(tplNormal) || tplNormal.includes(kl);
      });

      payload = { messaging_product: "whatsapp", recipient_type: "individual", to: num };

      if (
        matchedKey ||
        tplNormal.includes("eiat") ||
        tplNormal.includes("conf") ||
        templateUsed === "قالب فيسبوك"
      ) {
        payload.type = "template"; // Added this critical line
        config =
          (matchedKey && META_TEMPLATES_CONFIG[matchedKey]) ||
          ({
            name: tplNormal.includes("eiat1")
              ? "eiat1"
              : tplNormal.includes("eiat")
                ? "eiat"
                : tplNormal.includes("open")
                  ? "open"
                  : "confirmation",
            bodyParams:
              tplNormal.includes("eiat1") ? 1 : tplNormal.includes("confirmation") || tplNormal.includes("تأكيد") ? 4 : 0,
            hasHeaderImage: tplNormal.includes("eiat1") || tplNormal.includes("eiat"),
          } as { name: string; bodyParams: number; hasHeaderImage?: boolean });

        graphTemplateName = config.name;
        payload.type = "template";
        payload.template = {
          name: config.name,
          language: { code: "ar" },
        };

        const components: Array<Record<string, unknown>> = [];

        if (config.hasHeaderImage) {
          components.push({
            type: "header",
            parameters: [{ type: "image", image: { id: LOGO_MEDIA_ID } }],
          });
        }

        if (config.bodyParams > 0) {
          const pName = templateParams?.patientName || patientName || "عميلنا العزيز";
          const pDate = templateParams?.appointmentDate || new Date().toLocaleDateString("ar-SA");
          const pDoc = templateParams?.doctorName || "عيادات إيات";
          const pLoc = templateParams?.location || "حي الأندلس، جدة";

          const pool = [
            { type: "text", text: pName },
            { type: "text", text: pDate },
            { type: "text", text: pDoc },
            { type: "text", text: pLoc },
          ];
          const parameters = pool.slice(0, config.bodyParams);
          components.push({ type: "body", parameters });
        }

        if (components.length > 0) {
          (payload.template as { components?: unknown[] }).components = components;
        }
      } else {
        payload.type = "text";
        payload.text = { body: message || "مرحباً بكم" };
      }
    }

    const response = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let waData: Record<string, unknown> = {};
    try {
      const raw = await response.text();
      waData = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      waData = {error: {message: "Invalid JSON from WhatsApp Graph", code: 0}};
    }

    const graphErr = waData.error as
      | {code?: number; message?: string; error_user_title?: string; error_user_msg?: string}
      | undefined;
    const msgArr = waData.messages as {id?: string}[] | undefined;
    const wamid =
      Array.isArray(msgArr) && msgArr[0] && typeof msgArr[0].id === "string" ? msgArr[0].id : "";

    /** HTTP 200 alone is not enough — Meta errors often sit in `waData.error`, and webhooks match on `wamid`. */
    const graphOk = Boolean(response.ok && !graphErr && wamid);

    if (!graphOk) {
      console.warn("[WA send] Graph rejected or incomplete:", JSON.stringify(waData).slice(0, 2000));
    }

    const graphErrLine = graphErr
      ? `[${graphErr.code ?? "?"}] ${graphErr.error_user_msg || graphErr.message || graphErr.error_user_title || "Graph error"}`
      : !response.ok
        ? `HTTP ${response.status}`
        : !wamid
          ? "لم يُرجع واتساب معرف رسالة (wamid). تحقق من الرقم الدولي، التوكن، وصيغة لغة القالب في مدير فيسبوك (مثل ar)."
          : "";

    const previewText = (message || "").trim();
    const previewForSanity =
      metaTemplate?.name?.trim()
        ? normalizeMetaSanityMessagePreview(metaTemplate.name.trim(), previewText)
        : previewText;
    const outgoingBody =
      metaTemplate?.name?.trim()
        ? previewForSanity || `قالب واتساب: ${metaTemplate.name}`
        : config
          ? previewText || `[Template: ${config.name}]`
          : message || "";

    const phoneE164 = `+${num}`;

    await sanity.create({
      _type: "whatsappConversation",
      phoneNumber: phoneE164,
      patientName: patientName || "عميل غير معروف (V3.1)",
      messageBody: outgoingBody,
      status: graphOk ? "sent" : "failed",
      templateUsed: metaTemplate?.name?.trim()
        ? graphTemplateName
        : config
          ? config.name
          : templateUsed || "رسالة مخصصة",
      direction: "outgoing",
      sentAt: new Date().toISOString(),
      ...(graphOk && wamid ? {wamid} : {}),
      ...(!graphOk && graphErrLine ? {errorMessage: graphErrLine} : {}),
      notes: JSON.stringify({ version: "3.3", payload, waData, graphOk, graphErrLine }, null, 2),
    });

    return jsonCors({
      success: graphOk,
      version: "3.2",
      waData,
      ...(graphOk && wamid ? {wamid} : {}),
      ...(!graphOk && graphErrLine ? {error: graphErrLine} : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("WhatsApp API Error:", error);
    return jsonCors({ success: false, version: "3.2", error: msg }, { status: 500 });
  }
}
