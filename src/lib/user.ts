import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const DEMO_USER_ID = 1;

export async function getOrCreateUser() {
  let user = await db
    .select()
    .from(users)
    .where(eq(users.id, DEMO_USER_ID))
    .limit(1);

  if (user.length === 0) {
    const inserted = await db
      .insert(users)
      .values({ id: DEMO_USER_ID })
      .returning();
    return inserted[0];
  }

  return user[0];
}

export function generateRegistrationCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
