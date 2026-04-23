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
  /** Required when the approved template HEADER is TEXT with {{1}}, {{2}}, … */
  headerParameterValues?: string[];
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
        .split("\n")
        .map((line) => (OPEN_EN_LABEL_LINE.test(line) ? ar : line))
        .join("\n"),
    )
    .join("\n\n");
}

/** Client often sends only `قالب واتساب: {name}` when Meta body text is not cached — treat as stub. */
function isMetaTemplateStubSanityPreview(graphTemplateName: string, body: string): boolean {
  const b = (body || "").trim();
  if (!b) return true;
  const escaped = graphTemplateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`^قالب\\s*واتساب\\s*:\\s*${escaped}\\s*$`, "iu").test(b)) return true;
  if (/^قالب\s*واتساب\s*:\s*[\w-]+\s*$/iu.test(b)) return true;
  return false;
}

/** Readable text for the dashboard / Sanity log (not sent to Meta — template handles that). */
function formatMetaTemplateSanityBody(graphTemplateName: string, params: string[]): string {
  const vals = params.map((v) => String(v ?? "").trim());
  const gn = graphTemplateName.trim().toLowerCase();
  if (gn === "confirmation" && vals.length > 0) {
    const a = vals[0] ?? "—";
    const b = vals[1] ?? "—";
    const c = vals[2] ?? "—";
    const d = vals[3] ?? "—";
    const lines = [
      "✅ تأكيد موعد (قالب واتساب)",
      `👤 العميل: ${a}`,
      `🕐 الموعد: ${b}`,
      `🩺 الخدمة: ${c}`,
    ];
    if (d && d !== "—") lines.push(`🔖 مرجع التأكيد: ${d}`);
    return lines.join("\n");
  }
  if (vals.length === 0) return `قالب واتساب: ${graphTemplateName}`;
  return [`📱 قالب ${graphTemplateName}`, ...vals.map((v, i) => `${i + 1}. ${v}`)].join("\n");
}

function normalizeWaNumber(raw: string): string {
  let num = (raw || "").trim();
  num = num.replace(/[^\d+]/g, "");
  if (num.startsWith("00")) num = num.slice(2);
  if (num.startsWith("+")) num = num.slice(1);
  return num;
}

/** Meta rejects newlines / odd whitespace in template variables → (#100) Invalid parameter. */
function sanitizeWaTemplateParam(raw: string, maxLen = 1024): string {
  let s = String(raw ?? "")
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) s = "—";
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
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
  const bodyMaxLen = graphName.toLowerCase() === "confirmation" ? 30 : 1024;
  const bodyVals = (meta.bodyParameterValues || []).map((v) =>
    sanitizeWaTemplateParam(String(v ?? ""), bodyMaxLen),
  );
  const headerTextVals = (meta.headerParameterValues || []).map((v) =>
    sanitizeWaTemplateParam(String(v ?? ""), 512),
  );
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

  if (headerFormat === "TEXT" && headerTextVals.length > 0) {
    components.push({
      type: "header",
      parameters: headerTextVals.map((text) => ({ type: "text", text })),
    });
  } else if (headerFormat === "IMAGE") {
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

  if (bodyVals.length > 0) {
    components.push({
      type: "body",
      parameters: bodyVals.map((text) => ({ type: "text", text })),
    });
  }

  if (components.length > 0) {
    (payload.template as { components?: unknown[] }).components = components;
  }

  return { payload, graphName };
}

async function sendGraphPayload(payload: Record<string, unknown>): Promise<{
  response: Response;
  waData: Record<string, unknown>;
}> {
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
  return {response, waData};
}

function payloadTemplateName(payload: Record<string, unknown>): string {
  const tpl = payload.template as {name?: unknown} | undefined;
  return typeof tpl?.name === "string" ? tpl.name : "";
}

function payloadTemplateLanguage(payload: Record<string, unknown>): string {
  const tpl = payload.template as {language?: {code?: unknown}} | undefined;
  const raw = tpl?.language?.code;
  return typeof raw === "string" ? raw : "";
}

function withTemplateLanguage(payload: Record<string, unknown>, languageCode: string): Record<string, unknown> {
  const next = structuredClone(payload);
  const tpl = (next.template || {}) as {language?: {code?: string}};
  tpl.language = {code: languageCode};
  next.template = tpl as unknown as Record<string, unknown>;
  return next;
}

function withTemplateComponents(payload: Record<string, unknown>, mode: "keep" | "body-only" | "none"): Record<string, unknown> {
  const next = structuredClone(payload);
  const tpl = (next.template || {}) as {components?: Array<Record<string, unknown>>};
  const comps = Array.isArray(tpl.components) ? tpl.components : [];
  if (mode === "none") {
    delete tpl.components;
  } else if (mode === "body-only") {
    tpl.components = comps.filter((c) => String(c.type || "").toLowerCase() === "body");
    if (tpl.components.length === 0) delete tpl.components;
  }
  next.template = tpl as unknown as Record<string, unknown>;
  return next;
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
          const pName = sanitizeWaTemplateParam(templateParams?.patientName || patientName || "عميلنا العزيز");
          const pDate = sanitizeWaTemplateParam(
            templateParams?.appointmentDate || new Date().toLocaleDateString("ar-SA"),
          );
          const pDoc = sanitizeWaTemplateParam(templateParams?.doctorName || "عيادات إيات");
          const pLoc = sanitizeWaTemplateParam(templateParams?.location || "حي الأندلس، جدة");

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

    let {response, waData} = await sendGraphPayload(payload);

    const graphErr = waData.error as
      | {code?: number; message?: string; error_user_title?: string; error_user_msg?: string; error_data?: {details?: string}}
      | undefined;
    const msgArr = waData.messages as {id?: string}[] | undefined;
    let wamid =
      Array.isArray(msgArr) && msgArr[0] && typeof msgArr[0].id === "string" ? msgArr[0].id : "";

    /** HTTP 200 alone is not enough — Meta errors often sit in `waData.error`, and webhooks match on `wamid`. */
    let graphOk = Boolean(response.ok && !graphErr && wamid);

    // Meta often throws code 100 for template language/components mismatch. Retry with safe variants.
    if (!graphOk && graphErr?.code === 100 && payload.type === "template") {
      const tried = new Set<string>();
      const langNow = payloadTemplateLanguage(payload) || "ar";
      const langCandidates = [langNow, "ar", "ar_EG", "en_US"].filter((x, i, a) => !!x && a.indexOf(x) === i);
      const componentModes: Array<"keep" | "body-only" | "none"> = ["keep", "body-only", "none"];
      const attempts: Record<string, unknown>[] = [];
      for (const lang of langCandidates) {
        for (const mode of componentModes) {
          const candidate = withTemplateComponents(withTemplateLanguage(payload, lang), mode);
          const key = JSON.stringify({
            name: payloadTemplateName(candidate),
            lang: payloadTemplateLanguage(candidate),
            comps: ((candidate.template as {components?: unknown[]})?.components || []).length,
            mode,
          });
          if (tried.has(key)) continue;
          tried.add(key);
          attempts.push(candidate);
        }
      }
      for (const candidate of attempts) {
        const retried = await sendGraphPayload(candidate);
        const err = retried.waData.error as
          | {code?: number; message?: string; error_user_title?: string; error_user_msg?: string}
          | undefined;
        const msgs = retried.waData.messages as {id?: string}[] | undefined;
        const retryWamid =
          Array.isArray(msgs) && msgs[0] && typeof msgs[0].id === "string" ? msgs[0].id : "";
        const retryOk = Boolean(retried.response.ok && !err && retryWamid);
        if (retryOk) {
          response = retried.response;
          waData = retried.waData;
          payload = candidate;
          wamid = retryWamid;
          graphOk = true;
          break;
        }
      }
    }

    if (!graphOk) {
      console.warn("[WA send] Graph rejected or incomplete:", JSON.stringify(waData).slice(0, 2000));
    }

    const finalGraphErr = waData.error as
      | {code?: number; message?: string; error_user_title?: string; error_user_msg?: string; error_data?: {details?: string}}
      | undefined;

    const graphErrLine = finalGraphErr
      ? `[${finalGraphErr.code ?? "?"}] ${
          finalGraphErr.error_user_msg ||
          finalGraphErr.error_data?.details ||
          finalGraphErr.message ||
          finalGraphErr.error_user_title ||
          "Graph error"
        }`
      : !response.ok
        ? `HTTP ${response.status}`
        : !wamid
          ? "لم يُرجع واتساب معرف رسالة (wamid). تحقق من الرقم الدولي، التوكن، وصيغة لغة القالب في مدير فيسبوك (مثل ar)."
          : "";

    const previewText = (message || "").trim();
    const graphMetaName = metaTemplate?.name?.trim() || "";
    const previewForSanity = graphMetaName
      ? normalizeMetaSanityMessagePreview(graphMetaName, previewText)
      : previewText;

    const paramVals = metaTemplate?.bodyParameterValues ?? [];
    let outgoingBody: string;
    if (!graphOk) {
      const failedTemplateName = graphMetaName || config?.name || (templateUsed || "").trim() || "unknown";
      const details = graphErrLine ? `\nالسبب: ${graphErrLine}` : "";
      outgoingBody = `❌ فشل إرسال قالب واتساب: ${failedTemplateName}${details}`;
    } else if (graphMetaName && paramVals.length > 0) {
      const structured = formatMetaTemplateSanityBody(graphMetaName, paramVals);
      outgoingBody = isMetaTemplateStubSanityPreview(graphMetaName, previewForSanity)
        ? structured
        : previewForSanity || structured;
    } else if (graphMetaName) {
      outgoingBody = previewForSanity || `قالب واتساب: ${graphMetaName}`;
    } else {
      outgoingBody = config ? previewText || `[Template: ${config.name}]` : message || "";
    }

    const phoneE164 = `+${num}`;

    const resolvedPatientName =
      graphMetaName.toLowerCase() === "confirmation" && paramVals[0]?.trim()
        ? paramVals[0].trim()
        : (patientName || "").trim() || "عميل غير معروف (V3.1)";

    await sanity.create({
      _type: "whatsappConversation",
      phoneNumber: phoneE164,
      patientName: resolvedPatientName,
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
