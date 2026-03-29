# Active Context: TelegramCloud

## Current State

**Status**: ✅ Core features implemented with centralized bot architecture

TelegramCloud is a web application that uses a single shared Telegram bot to create private cloud storage groups for users. The bot token is configured via environment variable, and users connect through a registration code flow.

## Architecture

- **Centralized Bot**: Single bot token from `TELEGRAM_BOT_TOKEN` env var
- **Per-User Groups**: Bot creates a private group for each connected user
- **Registration Flow**: User gets a code, sends `/start CODE` to the bot on Telegram
- **Bot Webhook**: Handles `/start`, `/help`, `/status` commands

## Recently Completed

- [x] Restructured to centralized bot architecture
- [x] Added users table with Telegram linking fields
- [x] Built registration code flow (generate code -> bot creates group -> confirm)
- [x] Created Telegram bot webhook handler (`/api/telegram/webhook`)
- [x] Created user API routes (`/api/user` - status, connect, disconnect)
- [x] Updated all file/folder routes to be user-scoped
- [x] Rebuilt Settings page with 3-step connection flow
- [x] Updated Dashboard and Files pages to check connection status
- [x] Sidebar shows connection status indicator
- [x] Removed old per-user settings architecture

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/app/page.tsx` | Dashboard with stats |
| `src/app/files/page.tsx` | File browser |
| `src/app/settings/page.tsx` | Telegram connection flow |
| `src/app/api/user/route.ts` | User status/connect/disconnect |
| `src/app/api/telegram/webhook/route.ts` | Bot webhook handler |
| `src/app/api/files/route.ts` | Files list/update/delete |
| `src/app/api/files/upload/route.ts` | Upload to user's group |
| `src/app/api/files/download/route.ts` | Download URL / delete |
| `src/app/api/folders/route.ts` | Folders CRUD |
| `src/components/Sidebar.tsx` | Nav with connection status |
| `src/components/DropZone.tsx` | Drag & drop upload |
| `src/components/FileCard.tsx` | File display card |
| `src/components/FolderCard.tsx` | Folder display card |
| `src/hooks/useFileUpload.ts` | Upload state management |
| `src/lib/telegram.ts` | Telegram Bot API (raw HTTP) |
| `src/lib/user.ts` | User helper (get/create) |
| `src/lib/utils.ts` | Utility functions |
| `src/db/schema.ts` | Database schema (users, files, folders) |
| `src/db/index.ts` | Database client |

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | Yes |
| `NEXT_PUBLIC_BOT_USERNAME` | Bot username for links | No |
| `DB_URL` | Database API URL | Auto |
| `DB_TOKEN` | Database auth token | Auto |

## User Connection Flow

1. User clicks "Connect Telegram" in Settings
2. App generates registration code (stored in DB)
3. User sends `/start CODE` to the bot on Telegram
4. Bot webhook creates a private group via Telegram API
5. Bot updates user record with `telegramUserId` and `telegramGroupChatId`
6. User clicks "Confirm Connection" in the app
7. App verifies the group exists and starts accepting uploads

## Known Limitations

- Telegram Bot API has 50MB file size limit per upload
- `createNewChannel` uses undocumented Telegram API (may change)
- Single-user demo (hardcoded user ID = 1)
- No file preview functionality yet
- No bulk operations

## Session History

| Date | Changes |
|------|---------|
| 2026-03-29 | Initial build: database, API routes, frontend |
| 2026-03-29 | Restructured to centralized bot with per-user groups |
