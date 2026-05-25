const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const http = require("http");

const PORT = 3001;
const TARGET_NUMBER = "919585666020"; // order notifications go here

const app = express();
app.use(express.json());

let client = null;
let clientReady = false;

// ── WhatsApp client ──────────────────────────────────────────
function startWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: "C_001" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("\n[WhatsApp] Scan QR to connect:\n");
    qrcode.generate(qr, { small: true });
    clientReady = false;
  });

  client.on("ready", () => {
    console.log("[WhatsApp] Client ready — orders will be sent to", TARGET_NUMBER);
    clientReady = true;
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Authenticated");
  });

  client.on("auth_failure", (msg) => {
    console.error("[WhatsApp] Auth failed:", msg);
    clientReady = false;
  });

  client.on("disconnected", (reason) => {
    console.log("[WhatsApp] Disconnected:", reason);
    clientReady = false;
    setTimeout(startWhatsApp, 5000);
  });

  client.initialize();
}

// ── HTTP API ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ ready: clientReady });
});

app.post("/send", async (req, res) => {
  const { message, phone } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  if (!clientReady || !client) {
    return res.status(503).json({ error: "WhatsApp not connected" });
  }

  const number = (phone || TARGET_NUMBER).replace(/\D/g, "");
  const chatId = `${number}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    console.log(`[WhatsApp] Sent to ${chatId}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[WhatsApp] Send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] WhatsApp server running on port ${PORT}`);
  startWhatsApp();
});
