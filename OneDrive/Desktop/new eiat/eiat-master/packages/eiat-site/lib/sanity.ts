import { createClient } from "@sanity/client";

export const sanity = createClient({
  projectId: "f46widyg", // from sanity.json or sanity.io/manage
  dataset: "production",
  apiVersion: "2024-07-05", // use today’s date
  useCdn: true, // set to true for faster delivery
  token: process.env.SANITY_TOKEN, // optional, for secure reads
});
