import { jsonCors, emptyCors } from "../studio-cors";
import { waAccessToken, waBusinessAccountId } from "../wa-env";

export const dynamic = "force-dynamic";

const WA_BUSINESS_ID = waBusinessAccountId();
const GRAPH = `https://graph.facebook.com/v21.0`;

export function OPTIONS() {
  return emptyCors();
}

/** List message templates from Meta; falls back to known names if Graph is unavailable. */
export async function GET() {
  const WA_TOKEN = waAccessToken();

  if (!WA_TOKEN) {
    return jsonCors(
      { success: false, error: "WhatsApp API token not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `${GRAPH}/${WA_BUSINESS_ID}/message_templates?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.warn("[WhatsApp Meta API] Fetch error:", data.error?.message || res.status);
      return jsonCors(
        { success: false, error: data.error?.message || "Failed to fetch from Meta" },
        { status: res.status }
      );
    }

    // Map Meta's structure to our row format
    const rawTemplates = (data.data || []) as Array<Record<string, unknown>>;
    const templates = rawTemplates.map((t) => {
      const components = (t.components || []) as Array<{ type: string; text?: string; format?: string }>;
      const bodyComponent = components.find((c) => c.type === "BODY");
      return {
        name: t.name as string,
        language: t.language as string,
        category: t.category as string,
        bodyText: bodyComponent?.text || "",
        bodyVariableCount: (bodyComponent?.text?.match(/\{\{\d+\}\}/g) || []).length,
        headerFormat: components.find((c) => c.type === "HEADER")?.format || "NONE",
      };
    });

    return jsonCors({ success: true, templates });
  } catch (error) {
    console.error("[WhatsApp Meta API] Error:", error);
    return jsonCors(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
