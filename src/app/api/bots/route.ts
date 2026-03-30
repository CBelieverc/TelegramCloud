import { NextResponse } from "next/server";
import { db } from "@/db";
import { bots } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const allBots = await db
      .select()
      .from(bots)
      .where(eq(bots.userId, user.id));

    return NextResponse.json({
      bots: allBots.map((b) => ({
        id: b.id,
        botUsername: b.botUsername,
        telegramUserId: b.telegramUserId,
        telegramChatId: b.telegramChatId,
        registrationCode: b.registrationCode,
        isActive: b.isActive,
        linked: !!b.telegramChatId,
        linkedAt: b.linkedAt,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "activate") {
      const { botId } = body;
      if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
      }

      // Deactivate all bots, then activate the selected one
      await db
        .update(bots)
        .set({ isActive: false })
        .where(eq(bots.userId, user.id));
      await db
        .update(bots)
        .set({ isActive: true })
        .where(and(eq(bots.id, botId), eq(bots.userId, user.id)));

      return NextResponse.json({ success: true });
    }

    // Default: add a new bot
    const botUsername = (body.botUsername ?? "").replace("@", "").trim();
    if (!botUsername) {
      return NextResponse.json(
        { error: "botUsername is required" },
        { status: 400 }
      );
    }

    const code = randomBytes(4).toString("hex").toUpperCase();

    const existingBots = await db
      .select()
      .from(bots)
      .where(eq(bots.userId, user.id));

    const isFirst = existingBots.length === 0;

    const inserted = await db
      .insert(bots)
      .values({
        userId: user.id,
        botUsername,
        registrationCode: code,
        isActive: isFirst,
      })
      .returning();

    return NextResponse.json({
      success: true,
      bot: {
        id: inserted[0].id,
        botUsername: inserted[0].botUsername,
        registrationCode: inserted[0].registrationCode,
        isActive: inserted[0].isActive,
        linked: false,
      },
      telegramLink: `https://t.me/${botUsername}?start=${code}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const { action, botId } = body;

    if (action === "disconnect") {
      if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
      }

      const newCode = randomBytes(4).toString("hex").toUpperCase();
      await db
        .update(bots)
        .set({
          telegramUserId: null,
          telegramChatId: null,
          registrationCode: newCode,
          linkedAt: null,
          isActive: false,
        })
        .where(and(eq(bots.id, botId), eq(bots.userId, user.id)));

      return NextResponse.json({ success: true, registrationCode: newCode });
    }

    if (action === "confirm") {
      if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
      }

      const matched = await db
        .select()
        .from(bots)
        .where(and(eq(bots.id, botId), eq(bots.userId, user.id)))
        .limit(1);

      if (matched.length === 0 || !matched[0].telegramChatId) {
        return NextResponse.json(
          { error: "Bot not linked yet. Send /start CODE first." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        telegramChatId: matched[0].telegramChatId,
      });
    }

    if (action === "regenerate-code") {
      if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
      }

      const matched = await db
        .select()
        .from(bots)
        .where(and(eq(bots.id, botId), eq(bots.userId, user.id)))
        .limit(1);

      if (matched.length === 0) {
        return NextResponse.json({ error: "Bot not found" }, { status: 404 });
      }

      if (matched[0].telegramChatId) {
        return NextResponse.json(
          { error: "Bot already linked. Disconnect first." },
          { status: 400 }
        );
      }

      const newCode = randomBytes(4).toString("hex").toUpperCase();
      await db
        .update(bots)
        .set({ registrationCode: newCode })
        .where(eq(bots.id, botId));

      return NextResponse.json({
        success: true,
        registrationCode: newCode,
        telegramLink: `https://t.me/${matched[0].botUsername}?start=${newCode}`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json({ error: "botId required" }, { status: 400 });
    }

    await db
      .delete(bots)
      .where(and(eq(bots.id, parseInt(botId)), eq(bots.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
