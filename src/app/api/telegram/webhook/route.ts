import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createPrivateGroup,
  sendWelcomeMessage,
  isBotConfigured,
} from "@/lib/telegram";
import { eq } from "drizzle-orm";

interface TelegramUpdate {
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

export async function POST(request: Request) {
  try {
    if (!isBotConfigured()) {
      return NextResponse.json({ ok: true });
    }

    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text.trim();
    const telegramUserId = String(message.from?.id ?? message.chat.id);
    const chatId = String(message.chat.id);

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts.length > 1 ? parts[1].trim().toUpperCase() : null;

      if (code) {
        const matchedUsers = await db
          .select()
          .from(users)
          .where(eq(users.registrationCode, code))
          .limit(1);

        const matchedUser = matchedUsers[0];

        if (!matchedUser) {
          await sendTelegramMessage(
            chatId,
            "Invalid registration code. Please generate a new one from the web app."
          );
          return NextResponse.json({ ok: true });
        }

        if (matchedUser.telegramGroupChatId) {
          await sendTelegramMessage(
            chatId,
            "This account is already linked. Please disconnect from the web app first."
          );
          return NextResponse.json({ ok: true });
        }

        await sendTelegramMessage(
          chatId,
          "Creating your private cloud storage... Please wait."
        );

        let groupChatId: string;
        try {
          const result = await createPrivateGroup(matchedUser.id);
          groupChatId = result.chatId;
        } catch (error) {
          console.error("Failed to create group:", error);
          await sendTelegramMessage(
            chatId,
            "Failed to create storage group. Please try again or check bot permissions."
          );
          return NextResponse.json({ ok: true });
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
          await sendWelcomeMessage(groupChatId, matchedUser.id);
        } catch {}

        await sendTelegramMessage(
          chatId,
          `Your private cloud storage has been created!\n\n` +
            `Go back to the web app and click "Confirm Connection" to start uploading files.`
        );

        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(
        chatId,
        `Welcome to TelegramCloud!\n\n` +
          `To link your account:\n` +
          `1. Go to the web app Settings page\n` +
          `2. Click "Connect Telegram"\n` +
          `3. Copy the registration code\n` +
          `4. Send: /start YOUR_CODE`
      );

      return NextResponse.json({ ok: true });
    }

    if (text === "/help") {
      await sendTelegramMessage(
        chatId,
        `TelegramCloud Bot\n\n` +
          `/start [CODE] - Link your account\n` +
          `/status - Check your storage status\n` +
          `/help - Show this message`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/status") {
      const matchedUser = await db
        .select()
        .from(users)
        .where(eq(users.telegramUserId, telegramUserId))
        .limit(1);

      if (matchedUser.length === 0 || !matchedUser[0].telegramGroupChatId) {
        await sendTelegramMessage(
          chatId,
          "You don't have a linked account. Use /start CODE to link."
        );
      } else {
        const user = matchedUser[0];
        await sendTelegramMessage(
          chatId,
          `Your cloud storage is active!\n\n` +
            `User ID: #${user.id}\n` +
            `Group ID: ${user.telegramGroupChatId}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
