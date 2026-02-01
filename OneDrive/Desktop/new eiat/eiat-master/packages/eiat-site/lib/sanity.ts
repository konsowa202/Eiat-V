import { createClient } from "@sanity/client";

export const sanity = createClient({
  projectId: "f46widyg", // from sanity.json or sanity.io/manage
  dataset: "production",
  apiVersion: "2024-07-05", // use today's date
  useCdn: false, // set to false to always get fresh data from Sanity
  token: process.env.SANITY_TOKEN, // optional, for secure reads
});
