import {NextRequest} from "next/server";
import {jsonCors, emptyCors} from "../studio-cors";
import {parseEjatBookingXlsBuffer} from "@/lib/ejatBookingXls";
import type {MetaTemplateSendPayload} from "../send/route";
import {waAccessToken, waBusinessAccountId} from "../wa-env";

function requestOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function normalizeDigits(raw: string): string {
  let num = (raw || "").trim().replace(/[^\d+]/g, "");
  if (num.startsWith("00")) num = num.slice(2);
  if (num.startsWith("+")) num = num.slice(1);
  return num;
}

function normalizeTemplateValue(raw: string, fallback = "00"): string {
  const v = String(raw || "").replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (!v || v === "—") return fallback;
  return v;
}

function confirmationParams(row: {
  confirmation: {patientName: string; appointmentText: string; service: string; confirmRef: string}
}): [string, string, string, string] {
  return [
    normalizeTemplateValue(row.confirmation.patientName, "عميلنا"),
    normalizeTemplateValue(row.confirmation.appointmentText, "الموعد غير محدد"),
    normalizeTemplateValue(row.confirmation.service, "الخدمة غير محددة"),
    normalizeTemplateValue(row.confirmation.confirmRef, "00"),
  ];
}

type MetaTemplateSpec = {
  languageCode: string
  headerFormat: "NONE" | "IMAGE" | "TEXT" | "VIDEO" | "DOCUMENT"
  bodyVariableCount: number
  headerVariableCount: number
}

async function resolveMetaTemplateSpec(
  templateName: string,
  preferredLanguageCode: string,
): Promise<MetaTemplateSpec | null> {
  const token = waAccessToken();
  if (!token) return null;
  const businessId = waBusinessAccountId();
  const graph = "https://graph.facebook.com/v21.0";
  const res = await fetch(
    `${graph}/${businessId}/message_templates?name=${encodeURIComponent(templateName)}&limit=100`,
    {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"},
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {data?: Array<Record<string, unknown>>};
  const rows = Array.isArray(data.data) ? data.data : [];
  if (!rows.length) return null;
  const desired = preferredLanguageCode.trim().toLowerCase();
  const pick =
    rows.find((r) => String(r.language || "").trim().toLowerCase() === desired) ||
    rows.find((r) => String(r.language || "").toLowerCase().startsWith("ar")) ||
    rows[0];
  const comps = (pick.components || []) as Array<{type?: string; text?: string; format?: string}>;
  const body = comps.find((c) => String(c.type || "").toUpperCase() === "BODY");
  const header = comps.find((c) => String(c.type || "").toUpperCase() === "HEADER");
  const headerFormat = (String(header?.format || "NONE").toUpperCase() ||
    "NONE") as MetaTemplateSpec["headerFormat"];
  const bodyVariableCount = (String(body?.text || "").match(/\{\{\d+\}\}/g) || []).length;
  const headerVariableCount =
    headerFormat === "TEXT" ? (String(header?.text || "").match(/\{\{\d+\}\}/g) || []).length : 0;
  return {
    languageCode: String(pick.language || preferredLanguageCode || "ar").trim() || "ar",
    headerFormat,
    bodyVariableCount,
    headerVariableCount,
  };
}

export function OPTIONS() {
  return emptyCors();
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return jsonCors({success: false, error: "Expected multipart/form-data with file"}, {status: 400});
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return jsonCors({success: false, error: "file missing"}, {status: 400});
    }

    const dryRun =
      form.get("dryRun") === "1" ||
      form.get("dryRun") === "true" ||
      req.nextUrl.searchParams.get("dryRun") === "1";

    const templateName = String(form.get("templateName") || "confirmation").trim() || "confirmation";
    const preferredLanguageCode = String(form.get("languageCode") || "ar").trim() || "ar";
    const templateSpec = await resolveMetaTemplateSpec(templateName, preferredLanguageCode).catch(() => null);
    const languageCode = templateSpec?.languageCode || preferredLanguageCode;
    const bodyParamCount = templateSpec ? templateSpec.bodyVariableCount : 4;
    const headerFormat = templateSpec?.headerFormat || "NONE";
    const headerParamValues =
      headerFormat === "TEXT" && (templateSpec?.headerVariableCount || 0) > 0
        ? Array.from({length: templateSpec?.headerVariableCount || 0}, (_, i) => `Eiat-${i + 1}`)
        : undefined;

    const buf = await file.arrayBuffer();
    const rows = parseEjatBookingXlsBuffer(buf);

    if (rows.length === 0) {
      return jsonCors({success: false, error: "No data rows found in spreadsheet"}, {status: 400});
    }

    const preview = rows.map((r) => ({
      rowIndex: r.rowIndex,
      phone: r.phoneRaw,
      bodyParameterValues: confirmationParams(r),
      parseWarnings: r.parseWarnings,
    }));

    if (dryRun) {
      return jsonCors({success: true, dryRun: true, count: rows.length, rows: preview});
    }

    const origin = requestOrigin(req);
    const sendUrl = `${origin}/api/whatsapp/send`;

    const results: Array<{
      rowIndex: number;
      phone: string;
      ok: boolean;
      error?: string;
      parseWarnings?: string[];
    }> = [];

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const num = normalizeDigits(r.phoneRaw);
      if (!num || num.length < 8) {
        failed += 1;
        results.push({
          rowIndex: r.rowIndex,
          phone: r.phoneRaw,
          ok: false,
          error: "invalid phone",
          parseWarnings: r.parseWarnings,
        });
        continue;
      }

      const baseParams = confirmationParams(r);
      const bodyParams = Array.from({length: bodyParamCount}, (_, i) => baseParams[i] || "00");
      const metaTemplate: MetaTemplateSendPayload = {
        name: templateName,
        languageCode,
        bodyParameterValues: bodyParams,
        headerFormat,
        ...(headerParamValues ? {headerParameterValues: headerParamValues} : {}),
      };

      const filledPreview = bodyParams.join(" · ");

      const res = await fetch(sendUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          phone: num,
          message: filledPreview,
          patientName: r.confirmation.patientName,
          templateUsed: templateName,
          metaTemplate,
        }),
      });

      let data: {success?: boolean; error?: string} = {};
      try {
        data = (await res.json()) as {success?: boolean; error?: string};
      } catch {
        data = {};
      }

      if (data.success) {
        sent += 1;
        results.push({rowIndex: r.rowIndex, phone: r.phoneRaw, ok: true, parseWarnings: r.parseWarnings});
      } else {
        failed += 1;
        results.push({
          rowIndex: r.rowIndex,
          phone: r.phoneRaw,
          ok: false,
          error: data.error || `HTTP ${res.status}`,
          parseWarnings: r.parseWarnings,
        });
      }

      if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 150));
    }

    return jsonCors({
      success: failed === 0,
      sent,
      failed,
      total: rows.length,
      results,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({success: false, error: msg}, {status: 500});
  }
}
