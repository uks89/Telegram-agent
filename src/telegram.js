import { generateReply } from "./agent.js";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export function startTelegramPolling() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  let offset = 0;
  let stopped = false;

  async function poll() {
    while (!stopped) {
      try {
        const updates = await getUpdates({ token, offset });

        for (const update of updates) {
          offset = update.update_id + 1;
          await handleUpdate({ token, update });
        }
      } catch (error) {
        console.error("Telegram polling error:", error);
        await sleep(3000);
      }
    }
  }

  poll();

  return () => {
    stopped = true;
  };
}

async function getUpdates({ token, offset }) {
  const url = new URL(`${TELEGRAM_API_BASE}/bot${token}/getUpdates`);
  url.searchParams.set("timeout", "30");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));

  const response = await fetch(url);
  const body = await response.json();

  if (!body.ok) {
    throw new Error(`Telegram getUpdates failed: ${JSON.stringify(body)}`);
  }

  return body.result || [];
}

async function handleUpdate({ token, update }) {
  const message = update.message;

  if (!message?.text || message.from?.is_bot) {
    return;
  }

  const chatId = message.chat.id;
  const profileName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(" ");

  const reply = await generateReply({
    userId: `telegram:${chatId}`,
    profileName,
    message: message.text,
    platform: "Telegram"
  });

  await sendTelegramMessage({
    token,
    chatId,
    text: reply,
    replyToMessageId: message.message_id
  });
}

async function sendTelegramMessage({ token, chatId, text, replyToMessageId }) {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      reply_parameters: {
        message_id: replyToMessageId
      }
    })
  });

  const body = await response.json();

  if (!body.ok) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(body)}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
