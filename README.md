# TickTask Pro

A secure, offline-only task manager with a customizable Eisenhower Matrix, inspired by TickTick.

![TickTask Pro](https://via.placeholder.com/800x500?text=TickTask+Pro)

## Features

### 🎯 Customizable Eisenhower Matrix
- Define your own rules for automatic task placement
- Drag-and-drop between quadrants
- Manual override with persistent placement
- AND/OR logic for complex rule combinations

### ⚡ Quick Add with Smart Parsing
- Natural language date parsing ("tomorrow at 2pm", "next Friday")
- Inline tags with # syntax
- Auto-completion for existing tags
- Keyboard shortcut: `⌘/Ctrl + N`

### 🏷️ Lists & Tags
- Organize tasks in custom lists
- Color-coded tags
- Tag manager for bulk operations
- Filter by lists, tags, due dates

### ⚙️ User-Editable Defaults
- Default priority for new tasks
- Default due date rules
- Auto-apply tags
- Dark/Light theme

### 🔔 Reminders
- Desktop notifications
- Snooze and mark done from notification
- Background scheduler

### 🔐 Privacy-First
- 100% offline operation
- Local SQLite database
- No telemetry or cloud sync

## Tech Stack

| Concern | Technology |
|---------|------------|
| Runtime | Electron |
| UI | React + TypeScript |
| Styling | TailwindCSS + Framer Motion |
| Database | SQLite (better-sqlite3) |
| State | Zustand |
| Date Parsing | chrono-node |
| Drag & Drop | react-beautiful-dnd |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3 (for native module compilation)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ticktask-pro

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run postinstall
```

### Development

```bash
# Start development server with hot reload
npm run electron:dev
```

### Build

```bash
# Build for macOS ARM64
npm run build:mac

# Build for Windows x64
npm run build:win

# Build for all platforms
npm run build
```

## Project Structure

```
├── electron/
│   ├── main.ts          # Electron main process
│   ├── preload.ts       # Preload script (IPC bridge)
│   └── database.ts      # SQLite initialization & migrations
├── src/
│   ├── components/
│   │   ├── EisenhowerMatrix.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDrawer.tsx
│   │   ├── QuickAddModal.tsx
│   │   ├── RulesEditor.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── TagManager.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── store/
│   │   └── index.ts     # Zustand store
│   ├── types/
│   │   └── index.ts     # TypeScript types
│   ├── utils/
│   │   └── date.ts      # Date utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + N` | Quick add task |
| `⌘/Ctrl + F` | Focus search |
| `Esc` | Close modal/drawer |
| `Enter` | Submit quick add |

## Eisenhower Matrix Rules

The matrix engine evaluates tasks against rules in this order:
1. **Do First** (Urgent & Important)
2. **Schedule** (Important, Not Urgent)
3. **Delegate** (Urgent, Not Important)
4. **Eliminate** (Neither)

Each quadrant can have multiple conditions with AND/OR logic:

| Condition Type | Operators |
|----------------|-----------|
| Priority | is, is not, is one of |
| Due Date | within X days, after X days, overdue, no due date |
| Tag | includes, does not include |
| List | is, is not |

## Data Storage

All data is stored locally in SQLite:
- **macOS**: `~/Library/Application Support/ticktask-pro/ticktask.db`
- **Windows**: `%APPDATA%/ticktask-pro/ticktask.db`

## License

MIT

## Credits

Built with ❤️ using Electron, React, and SQLite.


