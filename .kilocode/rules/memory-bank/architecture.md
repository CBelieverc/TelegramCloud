# System Patterns: TelegramCloud

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                   # Root layout with sidebar
│   ├── page.tsx                     # Dashboard with stats
│   ├── globals.css                  # Tailwind imports
│   ├── settings/page.tsx            # Telegram connection flow
│   ├── files/page.tsx               # File browser
│   └── api/
│       ├── user/route.ts            # User status/connect/disconnect
│       ├── telegram/webhook/route.ts # Bot webhook handler
│       ├── files/
│       │   ├── route.ts             # List/update/delete files
│       │   ├── upload/route.ts      # Upload to Telegram group
│       │   └── download/route.ts    # Get download URL/delete
│       └── folders/route.ts         # Folder CRUD
├── components/
│   ├── Sidebar.tsx                  # Navigation with connection status
│   ├── DropZone.tsx                 # Drag & drop upload area
│   ├── FileCard.tsx                 # File display with actions
│   └── FolderCard.tsx               # Folder display with rename/delete
├── hooks/
│   └── useFileUpload.ts             # Upload state management hook
├── lib/
│   ├── telegram.ts                  # Telegram Bot API (raw HTTP)
│   ├── user.ts                      # User get/create helper
│   └── utils.ts                     # Format bytes, get file icon
└── db/
    ├── schema.ts                    # Drizzle schema (users, files, folders)
    ├── index.ts                     # Database client
    ├── migrate.ts                   # Migration runner
    └── migrations/                  # Generated SQL migrations
```

## Key Design Patterns

### 1. Centralized Bot + Per-User Groups

- One bot token configured via `TELEGRAM_BOT_TOKEN` env var
- Each user gets a private group created by the bot via `createNewChannel`
- All file operations use the user's `telegram_group_chat_id`
- No per-user bot configuration needed

### 2. Registration Code Flow

- User clicks "Connect" -> generates unique code stored in DB
- User sends `/start CODE` to bot on Telegram
- Bot webhook matches code to user, creates group, updates DB
- User clicks "Confirm" to verify and start uploading

### 3. User-Scoped Data

All queries are scoped to `userId`:
```typescript
const user = await getOrCreateUser();
const userFiles = await db.select().from(files).where(eq(files.userId, user.id));
```

### 4. Raw Telegram API

Instead of using a bot library, the app makes direct HTTP calls:
```typescript
async function telegramApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${method}`, { ... });
  return (await res.json()).result;
}
```

### 5. Client Components for Interactivity

All interactive pages use `"use client"` with:
- `useState` for local state
- `useCallback` for memoized fetchers
- Toast notifications for feedback
- Loading spinners for async operations
