// Bun automatically loads .env.local
export {};

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let users: any = null;

try {
  const { createDatabase } = await import("@kilocode/app-builder-db");
  const schema = await import("@/db/schema");
  db = createDatabase(schema);
  users = schema.users;
  console.log("[bot] Database connected");
} catch {
  console.log("[bot] Database not configured - bot will run without DB features");
}

function isDbReady(): boolean {
  return db !== null && users !== null;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`[bot] Telegram API error (${method}):`, data.description);
  }
  return data;
}

async function sendMessage(chatId: string, text: string) {
  await telegramApi("sendMessage", { chat_id: chatId, text });
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; last_name?: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
}

async function handleMessage(message: TelegramMessage) {
  if (!message.text) return;

  const text = message.text.trim();
  const chatId = String(message.chat.id);
  const telegramUserId = String(message.from?.id ?? message.chat.id);

  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const code = parts.length > 1 ? parts[1].trim().toUpperCase() : null;

    if (code) {
      if (!isDbReady()) {
        await sendMessage(chatId, "Bot is starting up. Please try again in a moment.");
        return;
      }

      const { eq } = await import("drizzle-orm");

      const matchedUsers = await db
        .select()
        .from(users)
        .where(eq(users.registrationCode, code))
        .limit(1);

      const matchedUser = matchedUsers[0];

      if (!matchedUser) {
        await sendMessage(chatId, "Invalid registration code. Please generate a new one from the web app.");
        return;
      }

      if (matchedUser.telegramGroupChatId) {
        await sendMessage(chatId, "This account is already linked. Please disconnect from the web app first.");
        return;
      }

      await sendMessage(chatId, "Creating your private cloud storage... Please wait.");

      let groupChatId: string;
      try {
        const result = await telegramApi("createNewChannel", {
          title: "My Cloud Storage",
          is_channel: false,
        });
        if (!result.ok) throw new Error(result.description);
        groupChatId = String(result.result.id);

        try {
          await telegramApi("setChatDescription", {
            chat_id: groupChatId,
            description: `Private cloud storage for user #${matchedUser.id}`,
          });
        } catch {}
      } catch (error) {
        console.error("[bot] Failed to create group:", error);
        await sendMessage(chatId, "Failed to create storage group. Please try again or check bot permissions.");
        return;
      }

      await db
        .update(users)
        .set({
          telegramUserId,
          telegramGroupChatId: groupChatId,
          linkedAt: new Date(),
        })
        .where(eq(users.id, matchedUser.id));

      try {
        await telegramApi("sendMessage", {
          chat_id: groupChatId,
          text:
            `Welcome to your private cloud storage!\n\n` +
            `User ID: #${matchedUser.id}\n` +
            `Files uploaded via the web app will appear here.`,
        });
      } catch {}

      await sendMessage(
        chatId,
        `Your private cloud storage has been created!\n\n` +
          `Go back to the web app and click "Confirm Connection" to start uploading files.`
      );
      return;
    }

    await sendMessage(
      chatId,
      `Welcome to TelegramCloud!\n\n` +
        `To link your account:\n` +
        `1. Go to the web app Settings page\n` +
        `2. Click "Connect Telegram"\n` +
        `3. Copy the registration code\n` +
        `4. Send: /start YOUR_CODE`
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      `TelegramCloud Bot\n\n` +
        `/start [CODE] - Link your account\n` +
        `/status - Check your storage status\n` +
        `/help - Show this message`
    );
    return;
  }

  if (text === "/status") {
    if (!isDbReady()) {
      await sendMessage(chatId, "Bot is starting up. Please try again in a moment.");
      return;
    }

    const { eq } = await import("drizzle-orm");

    const matchedUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramUserId, telegramUserId))
      .limit(1);

    if (matchedUser.length === 0 || !matchedUser[0].telegramGroupChatId) {
      await sendMessage(chatId, "You don't have a linked account. Use /start CODE to link.");
    } else {
      const user = matchedUser[0];
      await sendMessage(
        chatId,
        `Your cloud storage is active!\n\n` +
          `User ID: #${user.id}\n` +
          `Group ID: ${user.telegramGroupChatId}`
      );
    }
    return;
  }
}

async function poll() {
  let offset = 0;
  console.log("[bot] Polling started. Bot is listening for messages...");

  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`, {
        method: "GET",
        signal: AbortSignal.timeout(35000),
      });

      const data = await res.json();

      if (!data.ok) {
        console.error("[bot] getUpdates error:", data.description);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      for (const update of data.result) {
        offset = update.update_id + 1;

        if (update.message) {
          try {
            await handleMessage(update.message);
          } catch (err) {
            console.error("[bot] Error handling message:", err);
            try {
              await sendMessage(
                String(update.message.chat.id),
                "Something went wrong. Please try again."
              );
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        continue;
      }
      console.error("[bot] Poll error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

console.log("[bot] Starting TelegramCloud Bot...");
poll();
