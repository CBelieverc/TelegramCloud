// Bun automatically loads .env.local
export {};

let db: any = null;
let schema: any = null;

// Map to store bot instances by their token for quick lookup
const botInstances = new Map<string, string>();

try {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  schema = await import("@/db/schema");

  const sqlite = new Database("./data.db");
  sqlite.exec("PRAGMA journal_mode=WAL");
  sqlite.exec("PRAGMA foreign_keys=ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT,
      telegram_group_chat_id TEXT,
      registration_code TEXT,
      bot_username TEXT,
      linked_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bot_username TEXT NOT NULL,
      bot_token TEXT,
      telegram_user_id TEXT,
      telegram_chat_id TEXT,
      registration_code TEXT,
      active INTEGER DEFAULT 0,
      linked_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  db = drizzle(sqlite, { schema });
  console.log("[bot] Database connected");
} catch (err) {
  console.error("[bot] Database error:", err);
  process.exit(1);
}

// Initialize bot instances from database
async function initializeBotInstances() {
  try {
    const bots = await db.select().from(schema.bots);
    botInstances.clear();
    for (const bot of bots) {
      if (bot.botToken) {
        botInstances.set(bot.botToken, bot.botToken);
        console.log(`[bot] Loaded bot: @${bot.botUsername}`);
      }
    }
    console.log(`[bot] Initialized ${botInstances.size} bot instances`);
  } catch (err) {
    console.error("[bot] Failed to initialize bot instances:", err);
  }
}

// Get bot token by registration code
async function getBotTokenByRegistrationCode(registrationCode: string): Promise<string | null> {
  try {
    const { eq } = await import("drizzle-orm");
    const bot = await db
      .select()
      .from(schema.bots)
      .where(eq(schema.bots.registrationCode, registrationCode.toUpperCase()))
      .limit(1);
    
    if (bot.length > 0 && bot[0].botToken) {
      return bot[0].botToken;
    }
    return null;
  } catch (err) {
    console.error("[bot] Error getting bot token by registration code:", err);
    return null;
  }
}

// Get bot token by telegram user ID (for status command)
async function getBotTokenByTelegramUserId(telegramUserId: string): Promise<string | null> {
  try {
    const { eq } = await import("drizzle-orm");
    const bots = await db
      .select()
      .from(schema.bots)
      .where(eq(schema.bots.telegramUserId, telegramUserId))
      .limit(5); // Return multiple in case user has several bots
    
    if (bots.length > 0) {
      // Return the first active bot's token, or first bot's token if none active
      const activeBot = bots.find(b => b.active === 1);
      const token = (activeBot ?? bots[0])?.botToken ?? null;
      return token;
    }
    return null;
  } catch (err) {
    console.error("[bot] Error getting bot token by telegram user ID:", err);
    return null;
  }
}

// Make Telegram API call with specific bot token
async function telegramApi(method: string, body: Record<string, unknown>, botToken: string) {
  const API = `https://api.telegram.org/bot${botToken}`;
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

// Send message with specific bot token
async function sendMessage(chatId: string, text: string, botToken: string) {
  await telegramApi("sendMessage", { chat_id: chatId, text }, botToken);
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
      // Get bot token by registration code
      const botToken = await getBotTokenByRegistrationCode(code);
      
      if (!botToken) {
        await sendMessage(chatId, "Invalid registration code. Please generate a new one from the web app.", TOKEN); // Use global token for error message
        return;
      }

      // First check the bots table
      const { eq } = await import("drizzle-orm");
      const matchedBots = await db
        .select()
        .from(schema.bots)
        .where(eq(schema.bots.registrationCode, code))
        .limit(1);

      if (matchedBots.length > 0) {
        const matchedBot = matchedBots[0];

        if (matchedBot.telegramChatId) {
          await sendMessage(chatId, "This bot is already linked. Please disconnect from the web app first.", botToken);
          return;
        }

        await sendMessage(chatId, "Linking your bot... Please wait.", botToken);

        await db
          .update(schema.bots)
          .set({
            telegramUserId,
            telegramChatId: chatId,
            linkedAt: new Date(),
          })
          .where(eq(schema.bots.id, matchedBot.id));

        await sendMessage(
          chatId,
          `@${matchedBot.botUsername} has been linked!\n\n` +
            `Files uploaded via the web app using this bot will be sent to this chat.\n\n` +
            `Go back to the web app and click "Confirm Connection" to start uploading files.`,
          botToken
        );
        return;
      }

      // Fallback: check users table for backward compatibility
      const matchedUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.registrationCode, code))
        .limit(1);

      if (matchedUsers.length > 0) {
        const matchedUser = matchedUsers[0];

        if (matchedUser.telegramGroupChatId) {
          await sendMessage(chatId, "This account is already linked. Please disconnect from the web app first.", botToken);
          return;
        }

        await sendMessage(chatId, "Linking your account... Please wait.", botToken);

        await db
          .update(schema.users)
          .set({
            telegramUserId,
            telegramGroupChatId: chatId,
            linkedAt: new Date(),
          })
          .where(eq(schema.users.id, matchedUser.id));

        await sendMessage(
          chatId,
          `Your account has been linked!\n\n` +
            `Files uploaded via the web app will be sent to this chat.\n\n` +
            `Go back to the web app and click "Confirm Connection" to start uploading files.`,
          botToken
        );
        return;
      }

      await sendMessage(chatId, "Invalid registration code. Please generate a new one from the web app.", botToken);
      return;
    }

    await sendMessage(
      chatId,
      `Welcome to TelegramCloud!\n\n` +
        `To link your account:\n` +
        `1. Go to the web app Settings page\n` +
        `2. Click "Connect Telegram"\n` +
        `3. Copy the registration code\n` +
        `4. Send: /start YOUR_CODE`,
      TOKEN // Use global token for welcome message
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      `TelegramCloud Bot\n\n` +
        `/start [CODE] - Link your account\n` +
        `/status - Check your storage status\n` +
        `/help - Show this message`,
      TOKEN // Use global token for help message
    );
    return;
  }

  if (text === "/status") {
    const { eq } = await import("drizzle-orm");
    
    // Get bot token by telegram user ID
    const botToken = await getBotTokenByTelegramUserId(telegramUserId);
    
    if (!botToken) {
      await sendMessage(chatId, "You don't have a linked account. Use /start CODE to link.", TOKEN);
      return;
    }

    // Check bots table
    const matchedBots = await db
      .select()
      .from(schema.bots)
      .where(eq(schema.bots.telegramUserId, telegramUserId))
      .limit(5);

    if (matchedBots.length > 0) {
      const lines = matchedBots.map(
        (b: any) => `  @${b.botUsername} ${b.telegramChatId ? "(linked)" : "(not linked)"}`
      );
      await sendMessage(
        chatId,
        `Your linked bots:\n${lines.join("\n")}`,
        botToken
      );
      return;
    }

    // Check users table
    const matchedUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramUserId, telegramUserId))
      .limit(1);

    if (matchedUsers.length > 0 && matchedUsers[0].telegramGroupChatId) {
      await sendMessage(
        chatId,
        `Your cloud storage is active!\n\nUser ID: #${matchedUsers[0].id}`,
        botToken
      );
      return;
    }

    await sendMessage(chatId, "You don't have a linked account. Use /start CODE to link.", botToken);
    return;
  }
}

async function poll() {
  let offset = 0;
  console.log("[bot] Polling started. Bot is listening for messages...");

  // Periodically refresh bot instances to pick up new tokens
  let lastRefresh = Date.now();
  const REFRESH_INTERVAL = 30000; // 30 seconds

  while (true) {
    try {
      // Refresh bot instances periodically
      if (Date.now() - lastRefresh > REFRESH_INTERVAL) {
        await initializeBotInstances();
        lastRefresh = Date.now();
      }

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
              // Try to send error message with global token as fallback
              await sendMessage(
                String(update.message.chat.id),
                "Something went wrong. Please try again.",
                TOKEN
              );
            } catch {
              // Ignore errors sending error messages
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        continue;
      }
      console.error("[bot] Poll error:", err);
      
      // Try to reconnect to database on error
      try {
        await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds before retry
        // Reinitialize database connection
        const { Database } = await import("bun:sqlite");
        const { drizzle } = await import("drizzle-orm/bun-sqlite");
        const schema = await import("@/db/schema");
        
        const sqlite = new Database("./data.db");
        sqlite.exec("PRAGMA journal_mode=WAL");
        sqlite.exec("PRAGMA foreign_keys=ON");
        
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id TEXT,
            telegram_group_chat_id TEXT,
            registration_code TEXT,
            bot_username TEXT,
            linked_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch())
          );
          CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bot_username TEXT NOT NULL,
            bot_token TEXT,
            telegram_user_id TEXT,
            telegram_chat_id TEXT,
            registration_code TEXT,
            active INTEGER DEFAULT 0,
            linked_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch())
          );
        `);
        
        db = drizzle(sqlite, { schema });
        console.log("[bot] Database reconnected");
        
        // Refresh bot instances
        await initializeBotInstances();
      } catch (reconnectErr) {
        console.error("[bot] Failed to reconnect to database:", reconnectErr);
        await new Promise((r) => setTimeout(r, 10000)); // Wait longer if reconnection fails
      }
    }
  }
}

console.log("[bot] Starting TelegramCloud Bot...");
initializeBotInstances().then(() => {
  poll();
}).catch(err => {
  console.error("[bot] Failed to initialize bot instances:", err);
  // Still try to start polling even if initialization fails
  poll();
});
