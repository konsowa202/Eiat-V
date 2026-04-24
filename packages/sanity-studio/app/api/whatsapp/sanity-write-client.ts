import { createClient, type SanityClient } from "@sanity/client";

export function sanityWriteToken(): string {
  return (process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_TOKEN || "").trim();
}

export function sanityWriteConfigured(): boolean {
  return Boolean(sanityWriteToken());
}

let cachedClient: SanityClient | null = null;

function getWriteClient(): SanityClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "f46widyg",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token: sanityWriteToken() || undefined,
    useCdn: false,
  });
  return cachedClient;
}

/** Runs `fn` with a shared server-side Sanity client (write token). */
export async function withSanityWriteClient<T>(fn: (client: SanityClient) => Promise<T>): Promise<T> {
  return fn(getWriteClient());
}
