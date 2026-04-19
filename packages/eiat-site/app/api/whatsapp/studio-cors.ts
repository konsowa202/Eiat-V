import { NextResponse } from "next/server";

/** Sanity Studio (e.g. *.sanity.studio) calls these routes from the browser cross-origin. */
export const STUDIO_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonCors(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(STUDIO_CORS_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return NextResponse.json(body, {...init, headers});
}

export function emptyCors(status = 204): NextResponse {
  return new NextResponse(null, {status, headers: STUDIO_CORS_HEADERS});
}
