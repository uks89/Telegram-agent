import OpenAI from "openai";

const histories = new Map();
let client;
let clientKey;

function getHistory(userId) {
  if (!histories.has(userId)) {
    histories.set(userId, []);
  }

  return histories.get(userId);
}

export async function generateReply({ userId, message, profileName, platform }) {
  const history = getHistory(userId);
  const maxHistoryMessages = Number(process.env.MAX_HISTORY_MESSAGES || 12);
  const trimmedHistory = history.slice(-maxHistoryMessages);
  const { apiKey, baseURL, model, provider, defaultHeaders } = getAiConfig();
  const chatPlatform = platform || "chat";
  const agentName = process.env.AGENT_NAME || "Telegram Agent";
  const instructions =
    process.env.AGENT_INSTRUCTIONS ||
    "You are a helpful, concise WhatsApp assistant.";

  const aiClient = getClient({ apiKey, baseURL, provider, defaultHeaders });
  const response = await aiClient.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `${instructions}\n\nYou are chatting on ${chatPlatform} as ${agentName}. Keep replies mobile-friendly and avoid markdown tables.`
      },
      ...trimmedHistory,
      {
        role: "user",
        content: profileName ? `${profileName}: ${message}` : message
      }
    ]
  });

  const reply =
    response.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I could not generate a reply.";

  history.push(
    { role: "user", content: message },
    { role: "assistant", content: reply }
  );

  histories.set(userId, history.slice(-maxHistoryMessages));

  return reply;
}

function getAiConfig() {
  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();

  if (provider === "openrouter") {
    return {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Telegram Agent"
      }
    };
  }

  if (provider === "huggingface" || provider === "hf") {
    return {
      provider: "huggingface",
      apiKey: process.env.HF_TOKEN,
      baseURL: "https://router.huggingface.co/v1",
      model: process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct:fireworks-ai"
    };
  }

  if (provider === "groq") {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant"
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: undefined,
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini"
    };
  }

  if (provider === "custom") {
    return {
      provider: "custom",
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL
    };
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${provider}". Use openrouter, huggingface, groq, openai, or custom.`
  );
}

function getClient({ apiKey, baseURL, provider, defaultHeaders }) {
  if (!apiKey) {
    throw new Error(`Missing API key for AI_PROVIDER=${provider}.`);
  }

  const nextClientKey = `${provider}:${baseURL || "default"}:${apiKey.slice(-6)}`;

  if (client && clientKey === nextClientKey) {
    return client;
  }

  clientKey = nextClientKey;
  client = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders
  });

  return client;
}
