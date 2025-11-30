<div align="center">

<img src="assets/icons/icon.svg" alt="TickTaskPro Logo" width="120" height="120">

# TickTaskPro

**A secure, offline-only task manager with a customizable Eisenhower Matrix**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-9feaf9?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📥 For End Users

### Download & Install

**[Download the latest release →](https://github.com/MidnightRambo/TickTaskPro/releases/latest)**

#### macOS (Apple Silicon)
1. Download `TickTaskPro-X.X.X-mac-arm64.dmg`
2. Open the DMG file
3. Drag **TickTaskPro** to your Applications folder
4. Launch from Applications

> **Note**: On first launch, you may need to right-click → Open if macOS blocks the app (unsigned developer).

#### Windows (64-bit)
1. Download `TickTaskPro-X.X.X-win-x64.exe`
2. Run the installer
3. Choose installation directory (or use default)
4. Launch TickTaskPro from Start Menu or Desktop

---

## ✨ Features

### 🎯 Customizable Eisenhower Matrix
- **Define your own rules** for automatic task placement
- **Drag-and-drop** between quadrants
- **Manual override** with persistent placement
- **AND/OR logic** for complex rule combinations

### ⚡ Quick Add with Smart Parsing
- **Natural language** date parsing ("tomorrow at 2pm", "next Friday")
- **Inline tags** with `#` syntax
- **Auto-completion** for existing tags
- **Keyboard shortcut**: `⌘/Ctrl + N`

### 🔁 Recurring Tasks
- Daily, weekly, monthly, yearly patterns
- Custom recurrence intervals
- Automatic creation of next instance on completion

### 🏷️ Lists & Tags
- Organize tasks in **custom lists** with colors & icons
- **Color-coded tags** for visual organization
- **Tag manager** for bulk operations
- **Filter** by lists, tags, and due dates

### ⚙️ User-Editable Defaults
- Default priority for new tasks
- Default due date rules
- Auto-apply tags based on patterns
- Dark/Light theme

### 🔔 Smart Reminders
- **Desktop notifications** for upcoming tasks
- Background scheduler checks every minute
- Click notification to jump to task

### 💾 Backup & Export
- **One-click backup** to JSON
- **Import/restore** from backup files
- All data included: tasks, lists, tags, settings, rules

### 🔐 Privacy-First
- **100% offline** operation
- **Local SQLite** database
- **No telemetry** or cloud sync
- **Your data never leaves your machine**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + N` | Quick add task |
| `⌘/Ctrl + F` | Focus search |
| `Esc` | Close modal/drawer |
| `Enter` | Submit quick add |

---

## 📊 Eisenhower Matrix Rules

The matrix engine evaluates tasks against rules in this order:

1. **Do First** (Urgent & Important)
2. **Schedule** (Important, Not Urgent)
3. **Delegate** (Urgent, Not Important)
4. **Eliminate** (Neither)

### Condition Types

| Condition Type | Operators |
|----------------|-----------|
| **Priority** | is, is not, is one of |
| **Due Date** | within X days, after X days, overdue, no due date |
| **Tag** | includes, does not include |
| **List** | is, is not |

---

## 💽 Data Storage

All data is stored **locally** in SQLite:

- **macOS**: `~/Library/Application Support/TickTaskPro/ticktask.db`
- **Windows**: `%APPDATA%/TickTaskPro/ticktask.db`
- **Linux**: `~/.config/TickTaskPro/ticktask.db`

---

## 🛠️ For Developers

### Tech Stack

| Concern | Technology |
|---------|------------|
| **Runtime** | Electron 33 |
| **UI** | React 18 + TypeScript 5 |
| **Styling** | TailwindCSS + Framer Motion |
| **Database** | SQLite (better-sqlite3) |
| **State** | Zustand |
| **Date Parsing** | chrono-node |
| **Drag & Drop** | react-beautiful-dnd |
| **Build** | Vite + electron-builder |

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** or **yarn**
- **Python 3** (for native module compilation)
- **(macOS)** Xcode Command Line Tools
- **(Windows)** Visual Studio Build Tools

### Setup

```bash
# Clone the repository
git clone https://github.com/MidnightRambo/TickTaskPro.git
cd TickTaskPro

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run postinstall
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Or start with Electron immediately
npm run electron:dev
```

The app will open with:
- **Frontend**: `http://localhost:5173`
- **Hot reload** enabled for both frontend and Electron main process

### Building

```bash
# Build installers for your current platform
npm run dist

# Build for macOS (ARM64)
npm run dist:mac

# Build for Windows (x64)
npm run dist:win

# Output directory: release/
```

### Publishing

The GitHub Actions workflow automatically builds and releases on push to `main`:

```bash
# Tag a new version
npm version patch  # or minor, major

# Push to GitHub
git push origin main --follow-tags
```

**Artifacts are uploaded to GitHub Releases automatically.**

### Project Structure

```
TickTaskPro/
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
│   │   ├── ListView.tsx
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
├── assets/
│   └── icons/           # App icons (icns, ico, png, svg)
├── .github/
│   └── workflows/
│       └── release.yml  # CI/CD pipeline
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run electron:dev` | Start app in dev mode with hot reload |
| `npm run dist` | Build installer for current platform |
| `npm run dist:mac` | Build macOS DMG (local) |
| `npm run dist:win` | Build Windows installer (local) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run preview` | Preview production build |

### IPC Handlers

All database operations use Electron IPC:

```typescript
// Example: Get all tasks
const tasks = await window.electron.db.tasks.getAll()

// Example: Create a task
await window.electron.db.tasks.create({
  id: uuid(),
  title: 'My task',
  priority: 'high',
  // ...
})
```

Available handlers:
- `db:tasks:*` - Task CRUD operations
- `db:lists:*` - List management
- `db:tags:*` - Tag management
- `db:settings:*` - Settings operations
- `db:rules:*` - Eisenhower rules
- `backup:export` / `backup:import` / `backup:restore`
- `notification:show`

---

## 🚀 CI/CD Pipeline

Every push to `main` triggers:
1. ✅ Build on **macOS** and **Windows** runners
2. ✅ Package installers with electron-builder
3. ✅ Create/update GitHub Release with artifacts
4. ✅ Upload artifacts to workflow (30-day retention)

Release naming: `vX.Y.Z` (based on `package.json` version)

---

## 📄 License

MIT © [MidnightRambo](https://github.com/MidnightRambo)

---

## 🙏 Credits

Built with ❤️ using:
- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Framer Motion](https://www.framer.com/motion/)
- [chrono-node](https://github.com/wanasit/chrono)

---

<div align="center">

**[⬆ Back to top](#ticktaskpro)**

</div>
