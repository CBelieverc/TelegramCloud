import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, settings } from "@/db/schema";
import { sendFileToTelegram } from "@/lib/telegram";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import os from "os";

export async function POST(request: Request) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const configResult = await db.select().from(settings).limit(1);
    const config = configResult[0];

    if (!config) {
      return NextResponse.json(
        { error: "Telegram not configured. Go to Settings first." },
        { status: 400 }
      );
    }

    const tempDir = os.tmpdir();
    const tempName = `${randomUUID()}-${file.name}`;
    tempFilePath = join(tempDir, tempName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    const result = await sendFileToTelegram(
      config.botToken,
      config.chatId,
      tempFilePath,
      file.name,
      file.type || "application/octet-stream"
    );

    const newFile = await db
      .insert(files)
      .values({
        name: file.name,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: result.fileSize,
        telegramFileId: result.fileId,
        telegramMessageId: result.messageId,
        folderId: folderId ? parseInt(folderId) : null,
      })
      .returning();

    return NextResponse.json(newFile[0], { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {}
    }
  }
}
