import WebSocket from 'ws';
global.WebSocket = WebSocket;

import makeWASocket, {
  DisconnectReason,
  initAuthCreds,
  BufferJSON,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from "@whiskeysockets/baileys";
import express from "express";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pino from "pino";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vunkhbwzmyyzdddnturs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bmtoYnd6bXl5emRkZG50dXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDY3MDIsImV4cCI6MjA5NTEyMjcwMn0.H8t3HruKpWbu_XiRJ1wEr5bUGnVfqMV9G3T-T03WhpE';
const supabase = createClient(supabaseUrl, supabaseKey);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Custom Supabase Auth State Adapter
async function useSupabaseAuthState() {
  // Try to load creds
  const { data: credsData } = await supabase.from('wa_auth').select('data').eq('id', 'creds').single();
  let creds = credsData ? JSON.parse(credsData.data, BufferJSON.reviver) : initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          const keysToFetch = ids.map(id => `${type}-${id}`);
          const { data: keyRows } = await supabase.from('wa_auth').select('id, data').in('id', keysToFetch);
          if (keyRows) {
            for (const row of keyRows) {
              const id = row.id.split(`${type}-`)[1];
              data[id] = JSON.parse(row.data, BufferJSON.reviver);
            }
          }
          return data;
        },
        set: async (data) => {
          const upserts = [];
          const deletes = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                upserts.push({ id: key, data: JSON.stringify(value, BufferJSON.replacer) });
              } else {
                deletes.push(key);
              }
            }
          }
          if (upserts.length > 0) {
            for (const u of upserts) {
              // Upsert row by row since array upsert has size limits sometimes
              await supabase.from('wa_auth').upsert(u);
            }
          }
          if (deletes.length > 0) {
            await supabase.from('wa_auth').delete().in('id', deletes);
          }
        }
      }
    },
    saveCreds: async () => {
      await supabase.from('wa_auth').upsert({ id: 'creds', data: JSON.stringify(creds, BufferJSON.replacer) });
    }
  };
}
const OWNER_PHONE = process.env.OWNER_PHONE || "919585666020";
const PORT = process.env.WA_PORT || 3002;

const app = express();
app.use(express.json());

const logger = pino({ level: "silent" });

let sock = null;
let isConnected = false;
let currentQR = null;

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useSupabaseAuthState();
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      printQRInTerminal: true,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        isConnected = false;
        console.log("[WhatsApp] Please scan the QR code below:");
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === "close") {
        isConnected = false;
        currentQR = null;
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.log("[WhatsApp] Disconnected. Code:", code, "| LoggedOut:", loggedOut);
        if (loggedOut) {
          console.log("[WhatsApp] Session logged out — clearing auth from Supabase and reconnecting for QR...");
          try {
            await supabase.from('wa_auth').delete().neq('id', '__none__');
            console.log("[WhatsApp] Auth cleared.");
          } catch (e) {
            console.error("[WhatsApp] Failed to clear auth:", e.message);
          }
        }
        // Always reconnect — will show QR if session was cleared
        setTimeout(connectToWhatsApp, 3000);
      }

      if (connection === "open") {
        isConnected = true;
        currentQR = null;
        console.log(`[WhatsApp] ✅ Connected! Listening for new Supabase orders to send to ${OWNER_PHONE}`);
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (err) {
    console.error("[WhatsApp] Init error:", err.message);
    setTimeout(connectToWhatsApp, 10000);
  }
}

// ── Supabase Order Polling ──────────────────────────────────────────
async function pollOrders() {
  if (!isConnected || !sock) return; // Wait until WA is connected

  try {
    // Find un-sent orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('wa_sent', false)
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) throw error;

    for (const order of orders) {
      // Build message
      let msg = `📦 *New Order Received!*\n\n`;
      msg += `*Name:* ${order.customer_name}\n`;
      msg += `*Phone:* ${order.customer_phone}\n`;
      msg += `*Address:* ${order.address}\n`;
      if (order.maps_link) msg += `*Maps:* ${order.maps_link}\n`;
      msg += `*Payment:* ${order.payment_method}\n\n`;
      msg += `*Items:*\n`;
      
      const items = order.items || [];
      items.forEach((item, i) => {
        msg += `${i + 1}. ${item.productName} (${item.variantWeight}) - ${item.quantity}x = ₹${item.price * item.quantity}\n`;
      });
      
      msg += `\n*Total:* ₹${order.total}\n`;
      msg += `*Status:* ${order.status}`;

      const rawNum = OWNER_PHONE.replace(/\D/g, "");
      const jid = `${rawNum}@s.whatsapp.net`;

      // Send WA Message
      await sock.sendMessage(jid, { text: msg });
      console.log(`[WhatsApp] ✓ Sent order notification for ${order.customer_name}`);

      // Mark as sent in Supabase
      await supabase
        .from('orders')
        .update({ wa_sent: true })
        .eq('id', order.id);
    }
  } catch (err) {
    console.error("[Supabase Polling Error]:", err.message);
  }
}

// Poll every 5 seconds
setInterval(pollOrders, 5000);

// ── HTTP API for Admin Panel ────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ connected: isConnected, hasQR: !!currentQR });
});

app.get("/api/notify", async (req, res) => {
  const action = req.query.action;
  if (action === "qr") {
    if (isConnected) return res.json({ connected: true, qr: null });
    if (!currentQR) return res.json({ connected: false, qr: null, waiting: true });
    try {
      const qrImage = await qrcode.toDataURL(currentQR, { scale: 8, margin: 2 });
      res.json({ connected: false, qr: qrImage });
    } catch {
      res.status(500).json({ error: "QR generation failed" });
    }
  } else {
    res.json({ connected: isConnected, ready: isConnected, hasQR: !!currentQR });
  }
});

// Manual test endpoint
app.post("/api/notify", async (req, res) => {
  const { message, phone } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  if (!isConnected || !sock) return res.status(503).json({ error: "WhatsApp not connected" });

  const rawNum = (phone || OWNER_PHONE).replace(/\D/g, "");
  const jid = `${rawNum}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] ✓ Sent test message to ${rawNum}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════╗`);
  console.log(`║  Vinayaga Traders — WhatsApp Server       ║`);
  console.log(`║  Port: ${PORT}  |  Supabase Integrated      ║`);
  console.log(`╚═══════════════════════════════════════════╝\n`);
  connectToWhatsApp();
});
