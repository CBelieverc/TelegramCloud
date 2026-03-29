# Technical Context: TelegramCloud

## Technology Stack

| Technology    | Version | Purpose                          |
| ------------- | ------- | -------------------------------- |
| Next.js       | 16.x    | React framework with App Router  |
| React         | 19.x    | UI library                       |
| TypeScript    | 5.9.x   | Type-safe JavaScript             |
| Tailwind CSS  | 4.x     | Utility-first CSS                |
| Bun           | Latest  | Package manager & runtime        |
| Drizzle ORM   | 0.45.x  | Database ORM (SQLite)            |
| lucide-react  | 1.7.x   | Icon library                     |
| form-data     | 4.x     | Multipart form for file uploads  |

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

### users
| Column                  | Type    | Description                |
| ----------------------- | ------- | -------------------------- |
| id                      | integer | Primary key                |
| telegram_user_id        | text    | Telegram user ID           |
| telegram_group_chat_id  | text    | Private group chat ID      |
| registration_code       | text    | Temporary linking code     |
| linked_at               | integer | When Telegram was linked   |
| created_at              | integer | Account creation time      |

### folders
| Column     | Type    | Description              |
| ---------- | ------- | ------------------------ |
| id         | integer | Primary key              |
| user_id    | integer | Owner user ID            |
| name       | text    | Folder name              |
| parent_id  | integer | Parent folder (nullable) |
| created_at | integer | Creation timestamp       |

### files
| Column               | Type    | Description                  |
| -------------------- | ------- | ---------------------------- |
| id                   | integer | Primary key                  |
| user_id              | integer | Owner user ID                |
| name                 | text    | Display name                 |
| original_name        | text    | Original filename            |
| mime_type            | text    | MIME type                    |
| size                 | integer | File size in bytes           |
| telegram_file_id     | text    | Telegram file ID             |
| telegram_message_id  | integer | Telegram message ID          |
| folder_id            | integer | Parent folder (nullable)     |
| created_at           | integer | Upload timestamp             |

## Telegram Bot API

The app uses raw HTTP calls to the Telegram Bot API (not a library wrapper). Key endpoints:

- `POST /bot{token}/createNewChannel` - Create private group (undocumented)
- `POST /bot{token}/sendDocument` - Upload file (multipart form)
- `POST /bot{token}/getFile` - Get file download URL
- `POST /bot{token}/deleteMessage` - Delete message from group
- `POST /bot{token}/sendMessage` - Send text message
- `POST /bot{token}/createChatInviteLink` - Create invite link

## Key Dependencies

### Production
- `@kilocode/app-builder-db` - Sandbox database driver
- `drizzle-orm` - ORM for SQLite
- `lucide-react` - Icons
- `form-data` - Multipart form for file uploads

### Dev
- `drizzle-kit` - Migration generation
