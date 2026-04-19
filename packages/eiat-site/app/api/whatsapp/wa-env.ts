/**
 * Normalise WhatsApp Cloud API env names across deployments.
 * Some Vercel projects use `WA_ACCESS_TOKEN` instead of `WHATSAPP_ACCESS_TOKEN`.
 */
export function waAccessToken(): string {
  return (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WA_ACCESS_TOKEN || "").trim();
}

export function waPhoneNumberId(): string {
  const raw = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WA_PHONE_NUMBER_ID || "").trim();
  return raw || "1067072803156944";
}
