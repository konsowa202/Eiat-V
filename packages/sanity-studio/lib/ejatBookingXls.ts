import * as XLSX from "xlsx";

function cellStr(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v.replace(/\u00a0/g, " ").trim();
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v).replace(/\u00a0/g, " ").trim();
}

/** Matches Meta template `confirmation` body order: {{1}}…{{4}} in Studio labels. */
export type EjatConfirmationParams = {
  patientName: string;
  appointmentText: string;
  service: string;
  confirmRef: string;
};

export type EjatParsedRow = {
  rowIndex: number;
  senderName: string;
  messageText: string;
  phoneRaw: string;
  confirmation: EjatConfirmationParams;
  parseWarnings: string[];
};

/** Date as exported by local system: `2026-4-21` or `2026-04-21`. */
const RE_DATE = /بتاريخ\s*(\d{4}-\d{1,2}-\d{1,2})/u;

/** Time with optional `AM` / `PM` (Latin or Arabic م/ص). */
const RE_TIME = /الساعة\s*(\d{1,2}:\d{2}(?:\s*(?:[AP]M|[\u0645\u0635]))?)/iu;

/**
 * Parse the Arabic "local system" SMS/WhatsApp text (column B) into the four
 * utility-template variables used by Meta `confirmation`.
 *
 * Supports the live export shape, for example:
 * `السيد/ة : ساره , موعدكم` / `يوم الثلاثاء الساعة 08:30 PM بتاريخ 2026-4-21` /
 * `مع: عيادة الليزر والبشرة` + `في عيادات إيات…`.
 */
export function parseEjatLocalMessageToConfirmationParams(text: string): {
  confirmation: EjatConfirmationParams;
  warnings: string[];
} {
  const warnings: string[] = [];
  const t = (text || "").replace(/\r\n/g, "\n").trim();

  let patientName = "";
  const nameM = t.match(/السيد\s*\/\s*ة\s*:\s*([^،\n]+?)(?:\s*،\s*|\s*$)/u);
  if (nameM) patientName = nameM[1].trim();
  if (!patientName) {
    const nameEnComma = t.match(/السيد\s*\/\s*ة\s*:\s*(.+?)\s*,\s*موعدكم/iu);
    if (nameEnComma) patientName = nameEnComma[1].trim();
  }
  if (!patientName) {
    const nameM2 = t.match(/:\s*([^،\n]+?)\s*،\s*موعدكم/u);
    if (nameM2) patientName = nameM2[1].trim();
  }
  if (!patientName) {
    const nameM3 = t.match(/:\s*(.+?)\s*,\s*موعدكم/iu);
    if (nameM3) patientName = nameM3[1].trim();
  }
  if (!patientName) warnings.push("لم يُستخرج اسم العميل من النص");

  let dateStr = "";
  const dateM = t.match(RE_DATE);
  if (dateM) dateStr = dateM[1].trim();

  let dayStr = "";
  const dayM = t.match(/يوم\s+([^\n]+?)\s+الساعة/u);
  if (dayM) dayStr = dayM[1].trim();

  let timeStr = "";
  const timeM = t.match(RE_TIME);
  if (timeM) timeStr = timeM[1].trim().replace(/\s+/g, " ");

  let appointmentText = [dayStr, timeStr, dateStr ? `بتاريخ ${dateStr}` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!appointmentText) {
    appointmentText = [dateStr, dayStr, timeStr].filter(Boolean).join(" ").trim();
  }
  if (!appointmentText) {
    const fallback = t.match(/موعدكم[^\n]*/u);
    appointmentText = (fallback?.[0] || "").trim().slice(0, 200);
  }
  if (!appointmentText) warnings.push("لم يُستخرج نص الموعد");

  let service = "";
  const svcColonLine = t.match(/مع\s*:\s*([^\n]+)/u);
  if (svcColonLine) {
    service = svcColonLine[1].trim().replace(/\s+/g, " ");
    const cut = service.split(/\s+في\s+عيادات/)[0];
    if (cut) service = cut.trim();
  }
  if (!service) {
    const svcM = t.match(/مع\s+(.+?)\s+في\s+عيادات/u);
    if (svcM) service = svcM[1].trim().replace(/\s+/g, " ");
  }
  if (!service) {
    const svcM2 = t.match(/مع\s*:\s*([^\n]+)/u);
    if (svcM2) {
      service = svcM2[1].trim();
      const cut = service.split(/\s+في\s+/)[0];
      if (cut) service = cut.trim();
    }
  }
  if (!service) {
    const svcM3 = t.match(/مع\s+([^\n]+)/u);
    if (svcM3) {
      service = svcM3[1].trim();
      const cut = service.split(/\s+في\s+/)[0];
      if (cut) service = cut.trim();
    }
  }
  if (!service) warnings.push("لم تُستخرج الخدمة");

  let confirmRef = "";
  const refM = t.match(/رقم\s*(?:الحجز|التأكيد|الموعد)\s*[:\-]?\s*([A-Za-z0-9\u0660-\u0669\-]+)/u);
  if (refM) confirmRef = refM[1].trim();
  if (!confirmRef) {
    const codeM = t.match(/(?:كود|رمز)\s*[:\-]?\s*([A-Za-z0-9\u0660-\u0669\-]{3,})/u);
    if (codeM) confirmRef = codeM[1].trim();
  }

  const confirmation: EjatConfirmationParams = {
    patientName: patientName || "عميلنا",
    appointmentText: appointmentText || "—",
    service: service || "—",
    confirmRef: confirmRef || "00",
  };

  return {confirmation, warnings};
}

function findColumnIndex(header: string[], patterns: RegExp[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = header[i] || "";
    if (patterns.some((re) => re.test(h))) return i;
  }
  return -1;
}

const MAX_ROWS = 500;

export function parseEjatBookingXlsBuffer(buf: ArrayBuffer): EjatParsedRow[] {
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
  let msgCol = findColumnIndex(header, [/نص\s*الرسالة/i, /^نص الرسالة$/u, /الرسالة/u]);
  let phoneCol = findColumnIndex(header, [
    /رقم\s*المستقبل/u,
    /رقم\s*المستعمل/u,
    /المستقبل/u,
    /المستعمل/u,
    /الجوال/u,
    /mobile/i,
  ]);
  let senderCol = findColumnIndex(header, [/اسم\s*المرسل/u, /المرسل/u]);

  if (msgCol < 0) msgCol = 1;
  if (phoneCol < 0) phoneCol = 2;
  if (senderCol < 0) senderCol = 0;

  const out: EjatParsedRow[] = [];

  for (let i = 1; i < matrix.length && out.length < MAX_ROWS; i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;

    const messageText = cellStr(row[msgCol]);
    const phoneRaw = cellStr(row[phoneCol]);
    const senderName = cellStr(row[senderCol]);

    if (!messageText && !phoneRaw) continue;

    const {confirmation, warnings} = parseEjatLocalMessageToConfirmationParams(messageText);

    out.push({
      rowIndex: i + 1,
      senderName,
      messageText,
      phoneRaw,
      confirmation,
      parseWarnings: warnings,
    });
  }

  return out;
}
