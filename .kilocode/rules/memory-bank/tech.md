# Technical Context: TelegramCloud

## Technology Stack

| Technology          | Version  | Purpose                          |
| ------------------- | -------- | -------------------------------- |
| Next.js             | 16.x     | React framework with App Router  |
| React               | 19.x     | UI library                       |
| TypeScript          | 5.9.x    | Type-safe JavaScript             |
| Tailwind CSS        | 4.x      | Utility-first CSS                |
| Bun                 | Latest   | Package manager & runtime        |
| Drizzle ORM         | 0.45.x   | Database ORM (SQLite)            |
| node-telegram-bot-api | 0.67.x | Telegram Bot API client          |
| lucide-react        | 1.7.x    | Icon library                     |

## Development Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server
bun build          # Production build
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
bun db:generate    # Generate Drizzle migrations
bun db:migrate     # Run migrations
```

## Database Schema

### settings
| Column     | Type    | Description              |
| ---------- | ------- | ------------------------ |
| id         | integer | Primary key              |
| bot_token  | text    | Telegram bot token       |
| chat_id    | text    | Telegram group chat ID   |
| updated_at | integer | Last update timestamp    |

### folders
| Column    | Type    | Description              |
| --------- | ------- | ------------------------ |
| id        | integer | Primary key              |
| name      | text    | Folder name              |
| parent_id | integer | Parent folder (nullable) |
| created_at| integer | Creation timestamp       |

### files
| Column               | Type    | Description                 |
| -------------------- | ------- | --------------------------- |
| id                   | integer | Primary key                 |
| name                 | text    | Display name                |
| original_name        | text    | Original filename           |
| mime_type            | text    | MIME type                   |
| size                 | integer | File size in bytes          |
| telegram_file_id     | text    | Telegram file ID            |
| telegram_message_id  | integer | Telegram message ID         |
| folder_id            | integer | Parent folder (nullable)    |
| created_at           | integer | Creation timestamp          |

## Key Dependencies

### Production
- `@kilocode/app-builder-db` - Sandbox database driver
- `drizzle-orm` - ORM for SQLite
- `node-telegram-bot-api` - Telegram Bot API
- `lucide-react` - Icons

### Dev
- `drizzle-kit` - Migration generation
- `@types/node-telegram-bot-api` - TypeScript types
