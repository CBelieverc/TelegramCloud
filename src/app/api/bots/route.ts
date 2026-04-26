import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");

function getDb() {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("wal_checkpoint(TRUNCATE)");
  return db;
}

function getDemoUserId(db: ReturnType<typeof Database>): number {
  const user = db.prepare("SELECT id FROM users WHERE id = 1").get() as
    | { id: number }
    | undefined;
  if (!user) {
    db.prepare("INSERT INTO users (id) VALUES (1)").run();
    return 1;
  }
  return user.id;
}

export async function GET() {
  let db: ReturnType<typeof Database> | null = null;
  try {
    db = getDb();
    const userId = getDemoUserId(db);
     const allBots = db
       .prepare(
         "SELECT id, bot_username, bot_token, telegram_user_id, telegram_chat_id, registration_code, active, linked_at, created_at FROM bots WHERE user_id = ?"
       )
       .all(userId) as Array<{
       id: number;
       bot_username: string;
       bot_token: string | null;
       telegram_user_id: string | null;
       telegram_chat_id: string | null;
       registration_code: string | null;
       active: number;
       linked_at: number | null;
       created_at: number;
     }>;

     return NextResponse.json({
       bots: allBots.map((b) => ({
         id: b.id,
         botUsername: b.bot_username,
         botToken: b.bot_token,
         telegramUserId: b.telegram_user_id,
         telegramChatId: b.telegram_chat_id,
         registrationCode: b.registration_code,
         isActive: b.active === 1,
         linked: !!b.telegram_chat_id,
         linkedAt: b.linked_at
           ? new Date(b.linked_at * 1000).toISOString()
           : null,
         createdAt: new Date(b.created_at * 1000).toISOString(),
       })),
       timestamp: new Date().toISOString(),
     }, {
       headers: {
         "Cache-Control": "no-store, no-cache, must-revalidate",
         "Pragma": "no-cache",
       },
     });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    db?.close();
  }
}

export async function POST(request: Request) {
  let db: ReturnType<typeof Database> | null = null;
  try {
    db = getDb();
    const userId = getDemoUserId(db);
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "activate") {
      const { botId } = body;
      if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
      }
      db.prepare("UPDATE bots SET active = 0 WHERE user_id = ?").run(userId);
      db.prepare(
        "UPDATE bots SET active = 1 WHERE id = ? AND user_id = ?"
      ).run(botId, userId);
      return NextResponse.json({ success: true });
    }

     const botUsername = (body.botUsername ?? "").replace("@", "").trim();
     if (!botUsername) {
       return NextResponse.json(
         { error: "botUsername is required" },
         { status: 400 }
       );
     }

     // Bot token is optional now - can be added later
     const botToken = body.botToken ?? null;
     const code = randomBytes(4).toString("hex").toUpperCase();
     const existingCount = (
       db
         .prepare("SELECT COUNT(*) as cnt FROM bots WHERE user_id = ?")
         .get(userId) as { cnt: number }
     ).cnt;

     db.prepare(
       "INSERT INTO bots (user_id, bot_username, bot_token, registration_code, active) VALUES (?, ?, ?, ?, ?)"
     ).run(userId, botUsername, botToken, code, existingCount === 0 ? 1 : 0);

    const inserted = db
      .prepare(
        "SELECT id, bot_username, registration_code, active FROM bots WHERE user_id = ? ORDER BY id DESC LIMIT 1"
      )
      .get(userId) as {
      id: number;
      bot_username: string;
      registration_code: string;
      active: number;
    };

    return NextResponse.json({
      success: true,
      bot: {
        id: inserted.id,
        botUsername: inserted.bot_username,
        registrationCode: inserted.registration_code,
        isActive: inserted.active === 1,
        linked: false,
      },
      telegramLink: `https://t.me/${botUsername}?start=${code}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    db?.close();
  }
}

export async function PATCH(request: Request) {
  let db: ReturnType<typeof Database> | null = null;
  try {
    db = getDb();
    const userId = getDemoUserId(db);
    const body = await request.json();
    const { action, botId } = body;

    if (!botId) {
      return NextResponse.json({ error: "botId required" }, { status: 400 });
    }

    if (action === "disconnect") {
      const newCode = randomBytes(4).toString("hex").toUpperCase();
      db.prepare(
        "UPDATE bots SET telegram_user_id = NULL, telegram_chat_id = NULL, registration_code = ?, linked_at = NULL, active = 0 WHERE id = ? AND user_id = ?"
      ).run(newCode, botId, userId);
      return NextResponse.json({ success: true, registrationCode: newCode });
    }

    if (action === "confirm") {
      const bot = db
        .prepare(
          "SELECT telegram_chat_id FROM bots WHERE id = ? AND user_id = ?"
        )
        .get(botId, userId) as
        | { telegram_chat_id: string | null }
        | undefined;

      if (!bot || !bot.telegram_chat_id) {
        return NextResponse.json(
          { error: "Bot not linked yet. Send /start CODE first." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        telegramChatId: bot.telegram_chat_id,
      });
    }

    if (action === "regenerate-code") {
      const bot = db
        .prepare(
          "SELECT bot_username, telegram_chat_id FROM bots WHERE id = ? AND user_id = ?"
        )
        .get(botId, userId) as
        | { bot_username: string; telegram_chat_id: string | null }
        | undefined;

      if (!bot) {
        return NextResponse.json({ error: "Bot not found" }, { status: 404 });
      }
      if (bot.telegram_chat_id) {
        return NextResponse.json(
          { error: "Bot already linked. Disconnect first." },
          { status: 400 }
        );
      }

      const newCode = randomBytes(4).toString("hex").toUpperCase();
      db.prepare("UPDATE bots SET registration_code = ? WHERE id = ?").run(
        newCode,
        botId
      );
      return NextResponse.json({
        success: true,
        registrationCode: newCode,
        telegramLink: `https://t.me/${bot.bot_username}?start=${newCode}`,
      });
    }

     if (action === "update-token") {
       const botToken = body.botToken ?? null;
       db.prepare(
         "UPDATE bots SET bot_token = ? WHERE id = ? AND user_id = ?"
       ).run(botToken, botId, userId);
       return NextResponse.json({ success: true });
     }

     return NextResponse.json({ error: "Unknown action" }, { status: 400 });
   } catch (err) {
     const msg = err instanceof Error ? err.message : "Unknown error";
     return NextResponse.json({ error: msg }, { status: 500 });
   } finally {
     db?.close();
   }
}

export async function DELETE(request: Request) {
  let db: ReturnType<typeof Database> | null = null;
  try {
    db = getDb();
    const userId = getDemoUserId(db);
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json({ error: "botId required" }, { status: 400 });
    }

    db.prepare("DELETE FROM bots WHERE id = ? AND user_id = ?").run(
      parseInt(botId),
      userId
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    db?.close();
  }
}
