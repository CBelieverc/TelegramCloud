import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    const allFiles = folderId
      ? await db
          .select()
          .from(files)
          .where(eq(files.folderId, parseInt(folderId)))
      : await db
          .select()
          .from(files)
          .where(sql`${files.folderId} IS NULL`);

    const allFolders = folderId
      ? await db
          .select()
          .from(folders)
          .where(eq(folders.parentId, parseInt(folderId)))
      : await db
          .select()
          .from(folders)
          .where(sql`${folders.parentId} IS NULL`);

    const totalSize = await db
      .select({ total: sql<number>`SUM(${files.size})` })
      .from(files);

    return NextResponse.json({
      files: allFiles,
      folders: allFolders,
      totalSize: totalSize[0]?.total ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, folderId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (folderId !== undefined) updates.folderId = folderId;

    await db.update(files).set(updates).where(eq(files.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update file" },
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

    await db.delete(files).where(eq(files.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
