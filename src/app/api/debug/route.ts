import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "data.db");
  const db = new Database(dbPath);
  db.pragma("wal_checkpoint(TRUNCATE)");
  const bots = db.prepare("SELECT id, bot_username, registration_code, telegram_chat_id, active FROM bots").all();
  const users = db.prepare("SELECT id, registration_code, telegram_user_id, telegram_group_chat_id FROM users").all();
  db.close();
  return NextResponse.json({ bots, users, dbPath, timestamp: new Date().toISOString() });
}
