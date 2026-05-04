import crypto from "node:crypto";
import "dotenv/config";
import express from "express";
import { generateReply } from "./agent.js";
import { startTelegramPolling } from "./telegram.js";
import { extractIncomingMessages, sendTextMessage } from "./whatsapp.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const botPlatform = (process.env.BOT_PLATFORM || "telegram").toLowerCase();

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    }
  })
);

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "telegram-agent",
    platform: botPlatform,
    webhook: botPlatform === "whatsapp" ? "/webhook" : null
  });
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  if (!isValidMetaSignature(req)) {
    res.sendStatus(401);
    return;
  }

  res.sendStatus(200);

  const incomingMessages = extractIncomingMessages(req.body);

  await Promise.allSettled(
    incomingMessages.map(async (incoming) => {
      const reply = await generateReply({
        userId: incoming.from,
        profileName: incoming.profileName,
        message: incoming.text,
        platform: "WhatsApp"
      });

      await sendTextMessage({
        phoneNumberId: incoming.phoneNumberId,
        to: incoming.from,
        text: reply
      });
    })
  ).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(result.reason);
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Agent health server listening on http://localhost:${port}`);

  if (botPlatform === "telegram") {
    startTelegramPolling();
    console.log("Telegram polling started.");
  } else if (botPlatform === "whatsapp") {
    console.log("WhatsApp webhook mode enabled at /webhook.");
  } else {
    console.warn(`Unknown BOT_PLATFORM "${botPlatform}". No chat platform started.`);
  }
});

function isValidMetaSignature(req) {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    return true;
  }

  const signature = req.get("x-hub-signature-256");

  if (!signature?.startsWith("sha256=") || !req.rawBody) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(req.rawBody).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
