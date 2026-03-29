# Project Brief: TelegramCloud

## Purpose

TelegramCloud is a web application that turns Telegram into an unlimited cloud storage backend. Users create a private Telegram group, add a bot, and use the application to upload, download, and organize files with a clean web interface. Telegram's unlimited storage is leveraged as the storage layer.

## Target Users

- Users who want unlimited free cloud storage
- Developers who already use Telegram and want a file manager
- Anyone needing large file storage without paying for cloud services

## Core Use Case

1. User creates a private Telegram group and a bot via BotFather
2. User configures the bot token and chat ID in the app settings
3. User uploads files through the web interface
4. Files are sent to the private Telegram group via the Bot API
5. File metadata (name, size, type, telegram file ID) is stored locally in SQLite
6. User can browse, search, organize into folders, download, and delete files

## Key Requirements

### Must Have

- Telegram Bot API integration for file upload/download
- SQLite database for file metadata and folder structure
- File browser with folder navigation
- Drag & drop file upload
- File download via Telegram
- Search functionality
- Settings page for bot configuration

### Nice to Have

- File preview for images
- Bulk operations
- File sharing via links

## Constraints

- Telegram Bot API has a 50MB file upload limit per file
- Bot must be a member of the private group
- Chat ID must be the group's ID (starts with -100)
- Package manager: Bun
- Framework: Next.js 16 + React 19 + Tailwind CSS 4
