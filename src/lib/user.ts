import { db, ensureTablesExist } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const DEMO_USER_ID = 1;

export async function getOrCreateUser() {
  await ensureTablesExist();

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, DEMO_USER_ID))
      .limit(1);

    if (user.length > 0) {
      return user[0];
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("getOrCreateUser select failed:", msg);
    throw new Error(`Database query failed: ${msg}`);
  }

  try {
    const inserted = await db
      .insert(users)
      .values({ id: DEMO_USER_ID })
      .returning();
    return inserted[0];
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("getOrCreateUser insert failed:", msg);
    throw new Error(`Failed to create user: ${msg}`);
  }
}

export function generateRegistrationCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
