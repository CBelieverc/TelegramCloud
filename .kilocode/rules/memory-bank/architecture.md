# System Patterns: TelegramCloud

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Dashboard with stats
│   ├── globals.css             # Tailwind imports
│   ├── settings/page.tsx       # Bot configuration
│   ├── files/page.tsx          # File browser
│   └── api/
│       ├── settings/route.ts   # Settings CRUD
│       ├── files/
│       │   ├── route.ts        # List/update/delete files
│       │   ├── upload/route.ts # Upload to Telegram
│       │   └── download/route.ts # Get download URL
│       └── folders/route.ts    # Folder CRUD
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── DropZone.tsx            # Drag & drop upload
│   ├── FileCard.tsx            # File display card
│   └── FolderCard.tsx          # Folder display card
├── hooks/
│   └── useFileUpload.ts        # Upload state management
├── lib/
│   ├── telegram.ts             # Telegram Bot API wrapper
│   └── utils.ts                # Utility functions
└── db/
    ├── schema.ts               # Drizzle schema
    ├── index.ts                # Database client
    ├── migrate.ts              # Migration runner
    └── migrations/             # Generated migrations
```

## Key Design Patterns

### 1. Telegram as Storage Backend

Files are sent to a private Telegram group via Bot API. The app stores:
- `telegram_file_id` - For retrieving files later
- `telegram_message_id` - For deleting messages
- File metadata (name, size, type) in SQLite

### 2. Client-Side State Management

- `useState` for local component state
- Custom hooks (`useFileUpload`) for complex upload logic
- Toast notifications for user feedback
- No external state management library needed

### 3. API Route Pattern

All API routes follow REST conventions:
- `GET` - List/retrieve resources
- `POST` - Create resources
- `PATCH` - Update resources
- `DELETE` - Delete resources

### 4. Folder Navigation

Folders use a parent-child relationship with breadcrumbs for navigation. URL query params (`?folder=123`) track current folder.
