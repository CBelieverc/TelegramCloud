import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { getFileUrl, deleteTelegramMessage } from "@/lib/telegram";
import { getOrCreateUser } from "@/lib/user";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const fileResult = await db
      .select()
      .from(files)
      .where(and(eq(files.id, parseInt(id)), eq(files.userId, user.id)))
      .limit(1);
    const file = fileResult[0];

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const url = await getFileUrl(file.telegramFileId);

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
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const fileResult = await db
      .select()
      .from(files)
      .where(and(eq(files.id, parseInt(id)), eq(files.userId, user.id)))
      .limit(1);
    const file = fileResult[0];

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (user.telegramGroupChatId) {
      try {
        await deleteTelegramMessage(
          user.telegramGroupChatId,
          file.telegramMessageId
        );
      } catch (e) {
        console.error("Failed to delete from Telegram:", e);
      }
    }

    await db
      .delete(files)
      .where(and(eq(files.id, parseInt(id)), eq(files.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
