import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, settings } from "@/db/schema";
import { getFileUrl, deleteTelegramMessage } from "@/lib/telegram";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const configResult = await db.select().from(settings).limit(1);
    const config = configResult[0];

    if (!config) {
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 400 }
      );
    }

    const fileResult = await db
      .select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);
    const file = fileResult[0];

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const url = await getFileUrl(config.botToken, file.telegramFileId);

    return NextResponse.json({ url, name: file.name, mimeType: file.mimeType });
  } catch {
    return NextResponse.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const configResult = await db.select().from(settings).limit(1);
    const config = configResult[0];

    const fileResult = await db
      .select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);
    const file = fileResult[0];

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (config) {
      try {
        await deleteTelegramMessage(
          config.botToken,
          config.chatId,
          file.telegramMessageId
        );
      } catch (e) {
        console.error("Failed to delete from Telegram:", e);
      }
    }

    await db.delete(files).where(eq(files.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
