import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getOrCreateUser, generateRegistrationCode } from "@/lib/user";
import {
  createPrivateGroup,
  sendWelcomeMessage,
  isBotConfigured,
} from "@/lib/telegram";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const linked = !!user.telegramGroupChatId;

    return NextResponse.json({
      id: user.id,
      linked,
      telegramUserId: user.telegramUserId,
      telegramGroupChatId: user.telegramGroupChatId,
      registrationCode: user.registrationCode,
      botConfigured: isBotConfigured(),
      linkedAt: user.linkedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getOrCreateUser();

    if (user.telegramGroupChatId) {
      return NextResponse.json(
        { error: "Already linked. Disconnect first to relink." },
        { status: 400 }
      );
    }

    if (!isBotConfigured()) {
      return NextResponse.json(
        { error: "Bot is not configured. Set TELEGRAM_BOT_TOKEN env var." },
        { status: 400 }
      );
    }

    const code = generateRegistrationCode();

    await db
      .update(users)
      .set({ registrationCode: code })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      registrationCode: code,
      message: `Send /start ${code} to the bot on Telegram to link your account.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate registration code" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create-group") {
      const user = await getOrCreateUser();

      if (!user.telegramGroupChatId) {
        return NextResponse.json(
          { error: "Not linked to Telegram yet" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "confirm") {
      const user = await getOrCreateUser();

      if (!user.telegramGroupChatId) {
        return NextResponse.json(
          { error: "No group found. Send /start CODE to the bot first." },
          { status: 400 }
        );
      }

      try {
        await sendWelcomeMessage(user.telegramGroupChatId, user.id);
      } catch {
        // welcome message is not critical
      }

      return NextResponse.json({
        success: true,
        telegramGroupChatId: user.telegramGroupChatId,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getOrCreateUser();

    await db
      .update(users)
      .set({
        telegramUserId: null,
        telegramGroupChatId: null,
        registrationCode: null,
        linkedAt: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
