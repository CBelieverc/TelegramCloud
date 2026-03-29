# Product Context: TelegramCloud

## Why This Exists

Telegram provides unlimited file storage through its cloud infrastructure, but there's no native file manager interface. TelegramCloud fills this gap by providing a clean web UI to manage files stored in a private Telegram group, turning it into a personal cloud storage service.

## Problems It Solves

1. **Cost**: Eliminates paid cloud storage by leveraging Telegram's free unlimited storage
2. **Organization**: Telegram groups have no folder structure - this adds folders, search, and file management
3. **Usability**: Provides a Google Drive-like interface instead of scrolling through a chat
4. **Management**: Enables easy upload, download, rename, and delete operations

## User Flow

1. **Setup**: User creates Telegram bot and private group, enters credentials in Settings
2. **Upload**: User drags files or clicks to browse, files are sent to Telegram group
3. **Browse**: User sees files organized in a grid view with folders
4. **Organize**: User creates folders, renames files, moves items between folders
5. **Download**: User clicks download to get files back from Telegram
6. **Search**: User searches across all files and folders

## Key UX Goals

- **Dark theme**: Modern dark UI that's easy on the eyes
- **Drag & drop**: Intuitive file upload experience
- **Instant feedback**: Toast notifications for all operations
- **Responsive**: Works on desktop and mobile
- **Fast**: Local metadata means instant file listing
