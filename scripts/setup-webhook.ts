const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}

if (!webhookUrl) {
  console.error("Usage: WEBHOOK_URL=https://your-app.com bun run scripts/setup-webhook.ts");
  console.error("WEBHOOK_URL should be the base URL of your deployed app (without trailing path)");
  process.exit(1);
}

const fullUrl = `${webhookUrl.replace(/\/$/, "")}/api/telegram/webhook`;

async function setupWebhook() {
  console.log(`Setting webhook to: ${fullUrl}`);

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fullUrl }),
    }
  );

  const data = await res.json();

  if (data.ok) {
    console.log("Webhook set successfully!");
    console.log("Description:", data.description);
  } else {
    console.error("Failed to set webhook:", data.description);
    process.exit(1);
  }

  const infoRes = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  );
  const infoData = await infoRes.json();
  if (infoData.ok) {
    console.log("\nCurrent webhook info:");
    console.log("  URL:", infoData.result.url);
    console.log("  Has custom certificate:", infoData.result.has_custom_certificate);
    console.log("  Pending updates:", infoData.result.pending_update_count);
    if (infoData.result.last_error_date) {
      console.log("  Last error:", infoData.result.last_error_message);
      console.log("  Last error date:", new Date(infoData.result.last_error_date * 1000).toISOString());
    }
  }
}

setupWebhook();
