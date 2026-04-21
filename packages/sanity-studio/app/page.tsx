"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../sanity.config";

/**
 * Renders Sanity Studio at the root of this deployment (e.g. https://eiat-v.vercel.app/).
 * API routes in /app/api/* share the same origin so the studio can call them
 * without cross-origin setup.
 */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
