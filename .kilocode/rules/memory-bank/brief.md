# Project Brief: TelegramCloud

## Purpose

TelegramCloud is a web application that uses a single shared Telegram bot to create private cloud storage groups for users. The app developer creates one Telegram bot, and users connect to it to get their own private cloud storage group - completely free with unlimited storage.

## Target Users

- Users who want unlimited free cloud storage
- Anyone who already uses Telegram
- People who want a Google Drive alternative without paying

## Core Use Case

1. Developer creates a Telegram bot via BotFather and sets `TELEGRAM_BOT_TOKEN` env var
2. User visits the web app and clicks "Connect Telegram"
3. User sends a registration code to the bot on Telegram
4. The bot automatically creates a private group for that user's files
5. User uploads files through the web interface
6. Files are stored in the user's private Telegram group
7. User can browse, organize, download, and delete files

## Key Requirements

### Must Have

- Single centralized bot (token from env var)
- Per-user private Telegram groups (created automatically)
- Registration code linking flow
- Bot webhook for handling `/start CODE` commands
- File upload/download/delete via Telegram Bot API
- Folder organization and file metadata in SQLite
- Search across files and folders

### Nice to Have

- Multi-user authentication
- File preview for images
- Bulk operations
- File sharing via links

## Constraints

- Telegram Bot API has 50MB file upload limit per file
- `createNewChannel` is an undocumented Bot API method (may change)
- Bot must be able to create groups (may need specific permissions)
- Package manager: Bun
- Framework: Next.js 16 + React 19 + Tailwind CSS 4
