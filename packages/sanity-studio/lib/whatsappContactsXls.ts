import * as XLSX from "xlsx";

function cellStr(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v.replace(/\u00a0/g, " ").trim();
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v).replace(/\u00a0/g, " ").trim();
}

export type ContactImportRow = {
  rowIndex: number;
  nameRaw: string;
  phoneRaw: string;
};

function findColumnIndex(header: string[], patterns: RegExp[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = header[i] || "";
    if (patterns.some((re) => re.test(h))) return i;
  }
  return -1;
}

const MAX_ROWS = 25000;

export function parseWhatsappContactsXlsBuffer(buf: ArrayBuffer): ContactImportRow[] {
  const wb = XLSX.read(buf, {type: "array", cellDates: false});
  const firstName = wb.SheetNames[0];
  if (!firstName) return [];

  const sheet = wb.Sheets[firstName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!matrix.length) return [];

  const header = matrix[0].map((c) => cellStr(c));
  let nameCol = findColumnIndex(header, [/اسم/u, /name/i, /customer/i, /client/i]);
  let phoneCol = findColumnIndex(header, [/رقم/u, /جوال/u, /واتس/u, /phone/i, /mobile/i]);

  // Fallback for sheets where the first two columns are [phone, name] like your screenshot.
  if (phoneCol < 0) phoneCol = 0;
  if (nameCol < 0) nameCol = 1;

  const out: ContactImportRow[] = [];

  for (let i = 1; i < matrix.length && out.length < MAX_ROWS; i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    const phoneRaw = cellStr(row[phoneCol]);
    const nameRaw = cellStr(row[nameCol]);
    if (!phoneRaw && !nameRaw) continue;
    out.push({rowIndex: i + 1, nameRaw, phoneRaw});
  }

  return out;
}
