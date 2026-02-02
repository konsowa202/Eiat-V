const express = require("express");
const { exec } = require("child_process");

// Port for the webhook server (will be proxied by Nginx)
const APP_PORT = process.env.WEBHOOK_PORT || 4000;

// Shared secret – must match the value configured in the Sanity webhook
const SECRET = process.env.SANITY_WEBHOOK_SECRET || "EiatSuperSecretKey123!";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Simple health check endpoint
app.get("/webhook/health", (_req, res) => {
  res.send("ok");
});

// Main Sanity content webhook endpoint
app.post("/webhook/sanity-content", (req, res) => {
  const headerSecret = req.headers["x-sanity-secret"];

  if (headerSecret !== SECRET) {
    console.warn("Invalid webhook secret from", req.ip);
    return res.status(401).send("Invalid secret");
  }

  console.log("Sanity webhook received for document:", {
    _id: req.body?._id,
    _type: req.body?._type,
    _updatedAt: req.body?._updatedAt,
  });

  // Run deploy commands on the VPS
  const cmd =
    "cd /var/www/eiat && git pull origin master && pnpm build && pm2 restart eiat-site";

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("Deploy command failed:", err, stderr);
      return res.status(500).send("Command failed");
    }

    console.log("Deploy succeeded:", stdout);
    res.status(200).send("OK");
  });
});

app.listen(APP_PORT, () => {
  console.log(`Sanity webhook server listening on port ${APP_PORT}`);
});


