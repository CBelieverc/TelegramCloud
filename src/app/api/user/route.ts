import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getOrCreateUser, generateRegistrationCode } from "@/lib/user";
import {
  createPrivateGroup,
  sendWelcomeMessage,
  isBotConfigured,
  getBotUsername,
} from "@/lib/telegram";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const linked = !!user.telegramGroupChatId;
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "";

    return NextResponse.json({
      id: user.id,
      linked,
      telegramUserId: user.telegramUserId,
      telegramGroupChatId: user.telegramGroupChatId,
      registrationCode: user.registrationCode,
      botConfigured: isBotConfigured(),
      botUsername,
      linkedAt: user.linkedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/user error:", msg, err);
    return NextResponse.json(
      {
        error: msg,
        dbConfigured: !!(process.env.DB_URL && process.env.DB_TOKEN),
      },
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

    const code = generateRegistrationCode();

    await db
      .update(users)
      .set({ registrationCode: code })
      .where(eq(users.id, user.id));

    let botUsername = "";
    let telegramLink = "";

    // Try env var first, then API
    const envUsername = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "";
    if (envUsername) {
      botUsername = envUsername;
    } else if (isBotConfigured()) {
      try {
        botUsername = await getBotUsername();
      } catch (err) {
        console.error("Failed to get bot username:", err);
      }
    }

    if (botUsername) {
      telegramLink = `https://t.me/${botUsername}?start=${code}`;
    }

    return NextResponse.json({
      registrationCode: code,
      botUsername,
      telegramLink,
      botConfigured: isBotConfigured(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/user error:", msg, err);
    return NextResponse.json(
      {
        error: msg,
        dbConfigured: !!(process.env.DB_URL && process.env.DB_TOKEN),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("PATCH /api/user error:", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("DELETE /api/user error:", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
