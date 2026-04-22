import {NextRequest} from "next/server";
import {jsonCors, emptyCors} from "../studio-cors";
import {parseEjatBookingXlsBuffer} from "@/lib/ejatBookingXls";
import type {MetaTemplateSendPayload} from "../send/route";

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
    const languageCode = String(form.get("languageCode") || "ar").trim() || "ar";

    const buf = await file.arrayBuffer();
    const rows = parseEjatBookingXlsBuffer(buf);

    if (rows.length === 0) {
      return jsonCors({success: false, error: "No data rows found in spreadsheet"}, {status: 400});
    }

    const preview = rows.map((r) => ({
      rowIndex: r.rowIndex,
      phone: r.phoneRaw,
      bodyParameterValues: [
        r.confirmation.patientName,
        r.confirmation.appointmentText,
        r.confirmation.service,
        r.confirmation.confirmRef,
      ],
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

      const metaTemplate: MetaTemplateSendPayload = {
        name: templateName,
        languageCode,
        bodyParameterValues: [
          r.confirmation.patientName,
          r.confirmation.appointmentText,
          r.confirmation.service,
          r.confirmation.confirmRef,
        ],
        headerFormat: "NONE",
      };

      const filledPreview = [
        r.confirmation.patientName,
        r.confirmation.appointmentText,
        r.confirmation.service,
        r.confirmation.confirmRef,
      ].join(" · ");

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
