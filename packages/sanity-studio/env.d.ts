/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of Next.js app (no trailing slash), e.g. https://eiat-v.vercel.app — for WhatsApp /api when Studio is not on same host */
  readonly SANITY_STUDIO_WA_SITE_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
