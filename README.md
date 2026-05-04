# Telegram Agent

A lightweight Telegram chatbot powered by OpenRouter and other OpenAI-compatible AI providers.

The app uses Telegram long polling, so it can run locally without a public webhook URL, ngrok, or cloud hosting. It also includes optional WhatsApp Cloud API webhook support.

## Features

- Receives and replies to Telegram messages through the Telegram Bot API
- Sends chat messages to OpenRouter by default
- Supports OpenRouter, Hugging Face Inference Providers, Groq, OpenAI, and custom OpenAI-compatible APIs
- Keeps short in-memory chat history per conversation
- Exposes a small health endpoint at `GET /`
- Includes optional WhatsApp Cloud API webhook mode

## Tech Stack

- Node.js 20+
- Express
- OpenAI JavaScript SDK
- Telegram Bot API
- dotenv

## Requirements

- Node.js `>=20`
- A Telegram bot token from `@BotFather`
- An AI provider API key, such as an OpenRouter API key

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Create a Telegram bot:

   - Open Telegram
   - Message `@BotFather`
   - Run `/newbot`
   - Copy the token into `.env` as `TELEGRAM_BOT_TOKEN`

4. Create an OpenRouter API key:

   - Go to `https://openrouter.ai/keys`
   - Create an API key
   - Copy it into `.env` as `OPENROUTER_API_KEY`

5. Configure the default model:

   ```env
   AI_PROVIDER=openrouter
   OPENROUTER_MODEL=openai/gpt-oss-120b
   ```

6. Start the bot:

   ```bash
   npm start
   ```

   For development with automatic restarts:

   ```bash
   npm run dev
   ```

7. Send a message to your Telegram bot.

## Environment Variables

Minimum Telegram + OpenRouter configuration:

```env
PORT=3000
BOT_PLATFORM=telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-oss-120b
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Telegram Agent

AGENT_NAME=Telegram Agent
AGENT_INSTRUCTIONS=You are a helpful, concise Telegram assistant.
MAX_HISTORY_MESSAGES=12
```

Never commit `.env`, API keys, or bot tokens.

## AI Providers

### OpenRouter

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-oss-120b
```

### Hugging Face

```env
AI_PROVIDER=huggingface
HF_TOKEN=your-hugging-face-token
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct:fireworks-ai
```

### Groq

```env
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
```

### Custom OpenAI-Compatible Provider

```env
AI_PROVIDER=custom
AI_API_KEY=your-custom-provider-key
AI_BASE_URL=https://example.com/v1
AI_MODEL=provider-model-name
```

## Optional WhatsApp Mode

Set `BOT_PLATFORM=whatsapp` to enable the WhatsApp webhook route at `/webhook`.

```env
BOT_PLATFORM=whatsapp
META_VERIFY_TOKEN=make-a-long-random-token
META_ACCESS_TOKEN=your-meta-system-user-access-token
META_APP_SECRET=optional-meta-app-secret-for-webhook-signature-checks
META_GRAPH_VERSION=v25.0
```

WhatsApp mode requires a public HTTPS webhook URL and Meta WhatsApp Cloud API setup.

## Scripts

```bash
npm start
```

Runs `src/server.js`.

```bash
npm run dev
```

Runs the server with Node's watch mode.

## Project Structure

```text
src/
  agent.js      AI provider configuration and chat reply generation
  server.js     Express app, health endpoint, and platform startup
  telegram.js   Telegram long polling and message replies
  whatsapp.js   Optional WhatsApp webhook helpers
```

## Deployment Notes

- Long polling is simple for local use and small deployments.
- Use a process manager or hosting platform that keeps the Node.js process alive.
- In-memory chat history is reset on restart and is not shared across multiple instances.
- Use Redis, Postgres, or another persistent store before scaling horizontally.
- Rotate secrets immediately if they are ever committed or shared.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
