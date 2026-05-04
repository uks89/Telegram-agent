const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

export function extractIncomingMessages(body) {
  const messages = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      const contactsByWaId = new Map(
        (value.contacts || []).map((contact) => [
          contact.wa_id,
          contact.profile?.name || ""
        ])
      );

      for (const message of value.messages || []) {
        if (message.type !== "text" || !message.text?.body) {
          continue;
        }

        messages.push({
          id: message.id,
          from: message.from,
          profileName: contactsByWaId.get(message.from) || "",
          text: message.text.body,
          phoneNumberId
        });
      }
    }
  }

  return messages;
}

export async function sendTextMessage({ phoneNumberId, to, text }) {
  if (!ACCESS_TOKEN) {
    throw new Error("META_ACCESS_TOKEN is not configured.");
  }

  if (!phoneNumberId) {
    throw new Error("WhatsApp phone_number_id is missing from the webhook payload.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: text.slice(0, 4096)
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}
