import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { getOrCreateUser } from "@/lib/user";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const allFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, user.id));
    return NextResponse.json(allFolders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const newFolder = await db
      .insert(folders)
      .values({
        userId: user.id,
        name,
        parentId: parentId ?? null,
      })
      .returning();

    return NextResponse.json(newFolder[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Folder ID and name are required" },
        { status: 400 }
      );
    }

    await db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update folder" },
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
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(folders)
      .where(
        and(eq(folders.id, parseInt(id)), eq(folders.userId, user.id))
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
