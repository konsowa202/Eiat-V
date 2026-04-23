import {NextRequest} from "next/server";
import {createClient} from "@sanity/client";
import {jsonCors, emptyCors} from "../studio-cors";
import {parseWhatsappContactsXlsBuffer} from "@/lib/whatsappContactsXls";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
});

type PreparedContact = {
  rowIndex: number;
  name: string;
  phoneE164: string;
  phoneDigits: string;
};

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

function contactId(phoneDigits: string): string {
  return `whatsappContact.${phoneDigits}`;
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

    const source = String(form.get("source") || "excel-import").trim() || "excel-import";
    const tag = String(form.get("tag") || "excel").trim();

    const buf = await file.arrayBuffer();
    const rows = parseWhatsappContactsXlsBuffer(buf);
    if (rows.length === 0) {
      return jsonCors({success: false, error: "No rows found in spreadsheet"}, {status: 400});
    }

    const invalidRows: Array<{rowIndex: number; reason: string; phoneRaw: string; nameRaw: string}> = [];
    const dedupMap = new Map<string, PreparedContact>();
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
        rowIndex: row.rowIndex,
        name,
        phoneE164: norm.phoneE164,
        phoneDigits: norm.phoneDigits,
      });
    }

    const prepared = Array.from(dedupMap.values());
    const ids = prepared.map((p) => contactId(p.phoneDigits));
    const existingIds = new Set(
      await sanity.fetch<string[]>(
        `*[_type == "whatsappContact" && _id in $ids]._id`,
        {ids},
      ),
    );

    if (dryRun) {
      return jsonCors({
        success: true,
        dryRun: true,
        totalRows: rows.length,
        uniqueValid: prepared.length,
        invalid: invalidRows.length,
        willCreate: prepared.filter((p) => !existingIds.has(contactId(p.phoneDigits))).length,
        willUpdate: prepared.filter((p) => existingIds.has(contactId(p.phoneDigits))).length,
        preview: prepared.slice(0, 100).map((p) => ({
          rowIndex: p.rowIndex,
          name: p.name,
          phone: p.phoneE164,
          exists: existingIds.has(contactId(p.phoneDigits)),
        })),
        invalidRows: invalidRows.slice(0, 100),
      });
    }

    const nowIso = new Date().toISOString();
    const chunkSize = 200;
    let created = 0;
    let updated = 0;

    for (let i = 0; i < prepared.length; i += chunkSize) {
      const chunk = prepared.slice(i, i + chunkSize);
      const tx = sanity.transaction();
      for (const c of chunk) {
        const _id = contactId(c.phoneDigits);
        if (existingIds.has(_id)) updated += 1;
        else created += 1;
        tx.createOrReplace({
          _id,
          _type: "whatsappContact",
          name: c.name,
          phoneE164: c.phoneE164,
          phoneDigits: c.phoneDigits,
          status: "active",
          source,
          tags: tag ? [tag] : [],
          lastImportedAt: nowIso,
        });
      }
      await tx.commit();
    }

    return jsonCors({
      success: true,
      totalRows: rows.length,
      uniqueValid: prepared.length,
      invalid: invalidRows.length,
      created,
      updated,
      invalidRows: invalidRows.slice(0, 150),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonCors({success: false, error: msg}, {status: 500});
  }
}
