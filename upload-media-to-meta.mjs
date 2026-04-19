// upload-media-to-meta.mjs
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const TOKEN = "EAAX4fZBaR2nIBROqnQbXuHFlCHThrvGMG8TyDvsAYmt9nESwqAv5WCSwvfpLHFvWanwkXg8za6jm8ZCviZC3s0UvdTsiky7GadVHiGuJZAgSNYv39PzCZBVUP0FZBH20m9bFqapACTZChLruNgI4k8ofe0dgsA4Fh6P9fhXaQ8IHAEhEPsg9n7GCH2aeTO6NgZDZD";
const PHONE_ID = "1067072803156944";
const FILE_PATH = "packages/eiat-site/public/wa-logo.jpg";

async function upload() {
  console.log("Uploading media to Meta...");
  const form = new FormData();
  form.append('file', fs.createReadStream(FILE_PATH));
  form.append('type', 'image/jpeg');
  form.append('messaging_product', 'whatsapp');

  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/media`, {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${TOKEN}`
    },
    body: form
  });

  const data = await res.json();
  console.log("Upload Result:", data);
}

upload();
