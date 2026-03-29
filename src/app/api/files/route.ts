import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, folders, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    const fileQuery = folderId
      ? and(eq(files.userId, user.id), eq(files.folderId, parseInt(folderId)))
      : and(eq(files.userId, user.id), sql`${files.folderId} IS NULL`);

    const folderQuery = folderId
      ? and(
          eq(folders.userId, user.id),
          eq(folders.parentId, parseInt(folderId))
        )
      : and(eq(folders.userId, user.id), sql`${folders.parentId} IS NULL`);

    const allFiles = await db.select().from(files).where(fileQuery);
    const allFolders = await db.select().from(folders).where(folderQuery);

    const totalSize = await db
      .select({ total: sql<number>`SUM(${files.size})` })
      .from(files)
      .where(eq(files.userId, user.id));

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
    const user = await getOrCreateUser();
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

    await db
      .update(files)
      .set(updates)
      .where(and(eq(files.id, id), eq(files.userId, user.id)));

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
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
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
