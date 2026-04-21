// lib/sanityImage.ts
import imageUrlBuilder from "@sanity/image-url";
import { sanity } from "./sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

const builder = imageUrlBuilder(sanity);

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}

/** True when Sanity returned an image field we can pass to `urlFor` (avoids "Unable to resolve image URL from source (null)"). */
export function isSanityImageSource(value: unknown): value is SanityImageSource {
  if (value == null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v._ref === "string" && v._ref.length > 0) return true;
  const asset = v.asset;
  if (asset != null && typeof asset === "object") {
    const ref = (asset as Record<string, unknown>)._ref;
    return typeof ref === "string" && ref.length > 0;
  }
  return false;
}
