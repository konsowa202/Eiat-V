/**
 * Optional env used by the Sanity Studio plugin (WhatsAppTool) at runtime in the browser.
 * Kept for back-compat with older Studio/Vite builds; in Next.js the Studio lives at `/`
 * and the API routes live on the same origin so this variable is normally not needed.
 */
interface ImportMetaEnv {
  readonly SANITY_STUDIO_WA_SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
