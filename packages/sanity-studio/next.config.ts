import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

/**
 * Minimal `.env` merge (no dependency on `@next/env` typings). Does not override keys already set.
 */
function mergeEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const noExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = noExport.indexOf("=");
    if (eq <= 0) continue;
    const key = noExport.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let val = noExport.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

/**
 * During local dev, WhatsApp + Sanity keys often live in `packages/eiat-site/.env.local`.
 * Next only auto-loads env from *this* package directory, so merge eiat-site env when present.
 */
const eiatSiteDir = path.resolve(__dirname, "../eiat-site");
if (fs.existsSync(eiatSiteDir)) {
  mergeEnvFile(path.join(eiatSiteDir, ".env"));
  mergeEnvFile(path.join(eiatSiteDir, ".env.local"));
}

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ["placehold.co", "cdn.sanity.io"],
  },
};

export default nextConfig;
