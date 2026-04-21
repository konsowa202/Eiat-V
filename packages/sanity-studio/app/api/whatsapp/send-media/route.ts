import { NextRequest } from "next/server";
import { jsonCors, emptyCors } from "../studio-cors";
import { createClient } from "@sanity/client";
import { waAccessToken, waPhoneNumberId } from "../wa-env";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
});

const WA_PHONE_ID = waPhoneNumberId();
const GRAPH = `https://graph.facebook.com/v21.0`;
const REENGAGEMENT_TEMPLATE_NAME = process.env.WHATSAPP_REENGAGEMENT_TEMPLATE_NAME || "";
const REENGAGEMENT_TEMPLATE_LANG = process.env.WHATSAPP_REENGAGEMENT_TEMPLATE_LANG || "ar";

type WaKind = "image" | "video" | "audio" | "document";

function isReengagementError(waData: Record<string, unknown> | null | undefined): boolean {
  const err = waData?.error as { code?: string | number; error_subcode?: string | number; message?: string } | undefined;
  const code = String(err?.code || "");
  const subcode = String(err?.error_subcode || "");
  const msg = String(err?.message || "").toLowerCase();
  return (
    code === "131047" ||
    subcode === "2494073" ||
    msg.includes("re-engagement") ||
    msg.includes("outside the allowed window") ||
    msg.includes("24-hour")
  );
}

async function sendOpenConversationTemplate(params: {
  to: string;
  token: string;
}): Promise<{ ok: boolean; error?: string; templateWamid?: string }> {
  if (!REENGAGEMENT_TEMPLATE_NAME) {
    return { ok: false, error: "WHATSAPP_REENGAGEMENT_TEMPLATE_NAME is not configured" };
  }

  const tRes = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "template",
      template: {
        name: REENGAGEMENT_TEMPLATE_NAME,
        language: { code: REENGAGEMENT_TEMPLATE_LANG },
      },
    }),
  });

  const tData = await tRes.json();
  if (!tRes.ok) {
    const errMsg = tData?.error?.message || `HTTP ${tRes.status}`;
    const errCode = tData?.error?.code || "";
    return { ok: false, error: `[${errCode}] ${errMsg}` };
  }

  return { ok: true, templateWamid: tData?.messages?.[0]?.id || "" };
}

function normalizePhone(raw: string): string {
  let num = (raw || "").trim();
  num = num.replace(/[^\d+]/g, "");
  if (num.startsWith("00")) num = `+${num.slice(2)}`;
  if (!num.startsWith("+")) num = `+${num}`;
  const digits = num.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("966")) return digits;
  if (digits.length === 10 && digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`;
  return digits;
}

function detectKind(mime: string, name: string): WaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("sheet") ||
    mime.includes("document")
  )
    return "document";
  const lower = name.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(lower)) return "image";
  if (/\.(mp4|webm|3gp)$/i.test(lower)) return "video";
  if (/\.(ogg|opus|mp3|m4a|aac|wav)$/i.test(lower)) return "audio";
  return "document";
}

export function OPTIONS() {
  return emptyCors();
}

export async function POST(req: NextRequest) {
  const WA_TOKEN = waAccessToken();

  if (!WA_TOKEN) {
    return jsonCors(
      { success: false, error: "WhatsApp API token not configured" },
      { status: 500 }
    );
  }

  try {
    let phoneRaw: string | null = null;
    let patientName = "غير محدد";
    let caption = "";
    let templateUsed = "ميديا";
    let file: Blob | null = null;
    let fname = `upload-${Date.now()}.bin`;
    let mime = "application/octet-stream";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      phoneRaw = body?.phone || null;
      patientName = body?.patientName || "غير محدد";
      caption = body?.caption || "";
      templateUsed = body?.templateUsed || "ميديا";
      fname = body?.fileName || fname;
      mime = body?.fileType || mime;
      if (body?.fileDataBase64) {
        const bytes = Buffer.from(String(body.fileDataBase64), "base64");
        file = new Blob([bytes], { type: mime });
      }
    } else {
      const form = await req.formData();
      const f = form.get("file");
      phoneRaw = form.get("phone") as string | null;
      patientName = (form.get("patientName") as string) || "غير محدد";
      caption = (form.get("caption") as string) || "";
      templateUsed = (form.get("templateUsed") as string) || "ميديا";
      if (f instanceof Blob) {
        file = f;
        fname =
          f instanceof File && f.name
            ? f.name
            : fname;
        mime = f.type || mime;
      }
    }

    if (!phoneRaw || !file) {
      return jsonCors(
        { success: false, error: "phone and file are required" },
        { status: 400 }
      );
    }

    const num = normalizePhone(phoneRaw);
    if (!num || num.length < 8) {
      return jsonCors(
        { success: false, error: "invalid phone number" },
        { status: 400 }
      );
    }
    const kind = detectKind(mime, fname);

    const uploadForm = new FormData();
    uploadForm.append("messaging_product", "whatsapp");
    uploadForm.append("file", file, fname);

    const upRes = await fetch(`${GRAPH}/${WA_PHONE_ID}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
      body: uploadForm,
    });

    const upData = await upRes.json();
    if (!upRes.ok) {
      const errMsg = upData?.error?.message || `HTTP ${upRes.status}`;
      const errCode = upData?.error?.code || "";
      await sanity.create({
        _type: "whatsappConversation",
        patientName,
        phoneNumber: `+${num}`,
        messageBody: caption || `[${kind}]`,
        templateUsed,
        status: "failed",
        direction: "outgoing",
        messageKind: kind,
        sentAt: new Date().toISOString(),
        errorMessage: `[${errCode}] ${errMsg}`,
      });
      return jsonCors(
        { success: false, error: `[${errCode}] ${errMsg}` },
        { status: 400 }
      );
    }

    const mediaId = upData?.id as string;
    if (!mediaId) {
      return jsonCors(
        { success: false, error: "No media id from WhatsApp" },
        { status: 502 }
      );
    }

    let body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: num,
    };

    if (kind === "image") {
      body = {
        ...body,
        type: "image",
        image: {
          id: mediaId,
          ...(caption ? { caption } : {}),
        },
      };
    } else if (kind === "video") {
      body = {
        ...body,
        type: "video",
        video: {
          id: mediaId,
          ...(caption ? { caption } : {}),
        },
      };
    } else if (kind === "audio") {
      const voice =
        /voice|audio\/ogg|audio\/opus|audio\/mpeg|audio\/mp4/i.test(mime) ||
        /\.(ogg|opus|m4a)$/i.test(fname);
      body = {
        ...body,
        type: "audio",
        audio: voice
          ? { id: mediaId, voice: true }
          : { id: mediaId },
      };
    } else {
      body = {
        ...body,
        type: "document",
        document: {
          id: mediaId,
          filename: fname,
          ...(caption ? { caption } : {}),
        },
      };
    }

    const sendMediaOnce = async () => {
      const waRes = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const waData = await waRes.json();
      return { waRes, waData };
    };

    let { waRes, waData } = await sendMediaOnce();
    let reengaged = false;

    if (!waRes.ok && isReengagementError(waData)) {
      const reopen = await sendOpenConversationTemplate({ to: num, token: WA_TOKEN });
      if (!reopen.ok) {
        await sanity.create({
          _type: "whatsappConversation",
          patientName,
          phoneNumber: `+${num}`,
          messageBody: caption || `[${kind}]`,
          templateUsed,
          status: "failed",
          direction: "outgoing",
          messageKind: kind,
          waMediaId: mediaId,
          sentAt: new Date().toISOString(),
          errorMessage: `Re-engagement failed: ${reopen.error || "unknown error"}`,
        });
        return jsonCors(
          { success: false, error: `Re-engagement failed: ${reopen.error || "unknown error"}` },
          { status: 400 }
        );
      }
      reengaged = true;
      ({ waRes, waData } = await sendMediaOnce());
    }

    if (!waRes.ok) {
      const errMsg = waData?.error?.message || `HTTP ${waRes.status}`;
      const errCode = waData?.error?.code || "";
      await sanity.create({
        _type: "whatsappConversation",
        patientName,
        phoneNumber: `+${num}`,
        messageBody: caption || `[${kind}]`,
        templateUsed,
        status: "failed",
        direction: "outgoing",
        messageKind: kind,
        waMediaId: mediaId,
        sentAt: new Date().toISOString(),
        errorMessage: `[${errCode}] ${errMsg}`,
      });
      return jsonCors(
        { success: false, error: `[${errCode}] ${errMsg}` },
        { status: 400 }
      );
    }

    const wamid = waData?.messages?.[0]?.id || "";

    await sanity.create({
      _type: "whatsappConversation",
      patientName,
      phoneNumber: `+${num}`,
      messageBody: caption || `[${kind}]`,
      templateUsed,
      status: "sent",
      direction: "outgoing",
      messageKind: kind,
      waMediaId: mediaId,
      wamid,
      sentAt: new Date().toISOString(),
    });

    return jsonCors({
      success: true,
      wamid,
      phone: `+${num}`,
      mediaId,
      kind,
      reengaged,
    });
  } catch (error) {
    console.error("[WhatsApp Send Media] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return jsonCors({ success: false, error: msg }, { status: 500 });
  }
}
