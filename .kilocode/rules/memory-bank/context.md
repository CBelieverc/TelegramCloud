# Active Context: TelegramCloud

## Current State

**Status**: ✅ Core features implemented

TelegramCloud is a web application that uses Telegram as an unlimited cloud storage backend. Users configure a bot token and chat ID, then can upload, download, organize, and manage files through a clean web interface.

## Recently Completed

- [x] Database setup with Drizzle ORM (settings, files, folders tables)
- [x] Telegram Bot API integration (upload, download, delete)
- [x] Settings page with bot token and chat ID configuration
- [x] Dashboard with file/folder/size statistics
- [x] File browser with folder navigation and breadcrumbs
- [x] Drag & drop file upload with progress indicator
- [x] File download via Telegram file URL
- [x] Folder creation, renaming, and deletion
- [x] File deletion (local DB + Telegram message)
- [x] Search functionality across files and folders
- [x] Toast notifications for all operations
- [x] Dark theme UI with responsive layout

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/app/page.tsx` | Dashboard with stats |
| `src/app/files/page.tsx` | File browser |
| `src/app/settings/page.tsx` | Bot configuration |
| `src/app/api/settings/route.ts` | Settings API |
| `src/app/api/files/route.ts` | Files list/update/delete API |
| `src/app/api/files/upload/route.ts` | Upload to Telegram API |
| `src/app/api/files/download/route.ts` | Download URL API |
| `src/app/api/folders/route.ts` | Folders CRUD API |
| `src/components/Sidebar.tsx` | Navigation sidebar |
| `src/components/DropZone.tsx` | Drag & drop upload |
| `src/components/FileCard.tsx` | File display card |
| `src/components/FolderCard.tsx` | Folder display card |
| `src/hooks/useFileUpload.ts` | Upload state management |
| `src/lib/telegram.ts` | Telegram Bot API wrapper |
| `src/lib/utils.ts` | Utility functions |
| `src/db/schema.ts` | Database schema |
| `src/db/index.ts` | Database client |

## Known Limitations

- Telegram Bot API has 50MB file size limit per upload
- Bot must be admin in the Telegram group
- No file preview functionality yet
- No bulk operations

## Session History

| Date | Changes |
|------|---------|
| 2026-03-29 | Built TelegramCloud app: database, API routes, frontend pages, components |
