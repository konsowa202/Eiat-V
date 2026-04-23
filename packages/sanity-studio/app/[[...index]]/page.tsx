"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../sanity.config";

/**
 * Catch-all route for Sanity Studio tools (e.g. /whatsapp).
 * Prevents 404 on direct navigation or browser refresh.
 */
export default function StudioCatchAllPage() {
  return <NextStudio config={config} />;
}
