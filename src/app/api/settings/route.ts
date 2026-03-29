import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resetBotInstance } from "@/lib/telegram";

export async function GET() {
  try {
    const result = await db.select().from(settings).limit(1);
    const config = result[0] ?? null;
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { botToken, chatId } = body;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: "Bot token and Chat ID are required" },
        { status: 400 }
      );
    }

    const existing = await db.select().from(settings).limit(1);

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({ botToken, chatId, updatedAt: new Date() })
        .where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values({ botToken, chatId });
    }

    resetBotInstance();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
