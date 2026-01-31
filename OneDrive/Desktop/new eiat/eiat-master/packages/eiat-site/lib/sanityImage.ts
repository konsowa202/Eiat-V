// lib/sanityImage.ts
import imageUrlBuilder from "@sanity/image-url";
import { sanity } from "./sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

const builder = imageUrlBuilder(sanity);

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format');
}
