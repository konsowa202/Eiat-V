// send-eiat-fixed.js
const WA_PHONE_ID = "1067072803156944";
const WA_TOKEN = "EAAX4fZBaR2nIBROqnQbXuHFlCHThrvGMG8TyDvsAYmt9nESwqAv5WCSwvfpLHFvWanwkXg8za6jm8ZCviZC3s0UvdTsiky7GadVHiGuJZAgSNYv39PzCZBVUP0FZBH20m9bFqapACTZChLruNgI4k8ofe0dgsA4Fh6P9fhXaQ8IHAEhEPsg9n7GCH2aeTO6NgZDZD";
const PHONE = "201006119365";

async function send() {
  const payload = {
    messaging_product: "whatsapp",
    to: PHONE,
    type: "template",
    template: {
      name: "eiat",
      language: { code: "ar" },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: { link: "https://raw.githubusercontent.com/konsowa202/Eiat-V/master/packages/eiat-site/public/favicon.png" }
            }
          ]
        }
      ]
    }
  };

  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
send();
