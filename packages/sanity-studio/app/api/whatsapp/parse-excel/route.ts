import {NextRequest} from "next/server";
import {jsonCors, emptyCors} from "../studio-cors";
import {parseWhatsappContactsXlsBuffer} from "@/lib/whatsappContactsXls";

function normalizePhone(raw: string): {phoneE164: string; phoneDigits: string} | null {
  let v = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (!v) return null;
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (!v.startsWith("+")) v = `+${v}`;
  const digits = v.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;
  // Local SA defaults.
  if (digits.startsWith("966")) return {phoneE164: `+${digits}`, phoneDigits: digits};
  if (digits.length === 10 && digits.startsWith("05")) {
    const d = `966${digits.slice(1)}`;
    return {phoneE164: `+${d}`, phoneDigits: d};
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    const d = `966${digits}`;
    return {phoneE164: `+${d}`, phoneDigits: d};
  }
  return {phoneE164: `+${digits}`, phoneDigits: digits};
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

    const buf = await file.arrayBuffer();
    const rows = parseWhatsappContactsXlsBuffer(buf);
    if (rows.length === 0) {
      return jsonCors({success: false, error: "No rows found in spreadsheet"}, {status: 400});
    }

    const invalidRows: Array<{rowIndex: number; reason: string; phoneRaw: string; nameRaw: string}> = [];
    const dedupMap = new Map<string, {name: string, phoneE164: string}>();
    
    for (const row of rows) {
      const norm = normalizePhone(row.phoneRaw);
      if (!norm) {
        invalidRows.push({
          rowIndex: row.rowIndex,
          reason: "invalid phone",
          phoneRaw: row.phoneRaw,
          nameRaw: row.nameRaw,
        });
        continue;
      }
      const name = row.nameRaw.trim() || "بدون اسم";
      dedupMap.set(norm.phoneDigits, {
        name,
        phoneE164: norm.phoneE164,
      });
    }

    const prepared = Array.from(dedupMap.values());

    return jsonCors({
      success: true,
      totalRows: rows.length,
      uniqueValid: prepared.length,
      invalid: invalidRows.length,
      targets: prepared,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({success: false, error: msg}, {status: 500});
  }
}
