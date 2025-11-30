import { app, BrowserWindow, ipcMain, Notification, globalShortcut, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, getDatabase } from './database'
import type { Task, List, Tag, Settings, EisenhowerRule } from '../src/types'

// Set the app name for macOS dock and Windows taskbar
app.name = 'TickTaskPro'

let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// Resolve icon path - works for both dev and production
function getIconPath(): string {
  // NOTE: Replace assets/icons/icon.png with your real TickTaskPro icon
  if (VITE_DEV_SERVER_URL) {
    // Development: icon is relative to project root
    return path.join(__dirname, '..', 'assets', 'icons', 'icon.png')
  } else {
    // Production: icon is in extraResources
    return path.join(process.resourcesPath, 'icons', 'icon.png')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'TickTaskPro',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#09090b',
    icon: getIconPath(), // NOTE: Replace with real TickTaskPro icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    // DevTools can be opened manually via Cmd+Opt+I or View menu
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Register global shortcut for quick add
  globalShortcut.register('CommandOrControl+N', () => {
    mainWindow?.webContents.send('trigger-quick-add')
  })
}

app.whenReady().then(() => {
  initDatabase()
  
  // Set dock icon explicitly on macOS (important for development mode)
  if (process.platform === 'darwin' && app.dock) {
    const dockIconPath = VITE_DEV_SERVER_URL
      ? path.join(__dirname, '..', 'assets', 'icons', 'icon.png')
      : path.join(process.resourcesPath, 'icons', 'icon.png')
    
    // Only set if file exists (graceful fallback)
    if (fs.existsSync(dockIconPath)) {
      const icon = nativeImage.createFromPath(dockIconPath)
      if (!icon.isEmpty()) {
        app.dock.setIcon(icon)
      }
    } else {
      console.log('TickTaskPro: Dock icon not found at:', dockIconPath)
      console.log('Place your icon.png in assets/icons/ for the dock icon to appear.')
    }
  }
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Start reminder scheduler
  startReminderScheduler()
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============= DATABASE IPC HANDLERS =============

// Tasks
ipcMain.handle('db:tasks:getAll', () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all()
})

ipcMain.handle('db:tasks:getById', (_, id: string) => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
})

ipcMain.handle('db:tasks:create', (_, task: Task) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, listId, tags, priority, dueDate, completed, recurrenceRule, createdAt, updatedAt, manualQuadrant)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    task.id,
    task.title,
    task.description || null,
    task.listId || null,
    JSON.stringify(task.tags || []),
    task.priority || 'none',
    task.dueDate || null,
    task.completed ? 1 : 0,
    task.recurrenceRule || null,
    task.createdAt,
    task.updatedAt,
    task.manualQuadrant || null
  )
  return task
})

ipcMain.handle('db:tasks:update', (_, task: Task) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      listId = ?,
      tags = ?,
      priority = ?,
      dueDate = ?,
      completed = ?,
      recurrenceRule = ?,
      updatedAt = ?,
      manualQuadrant = ?
    WHERE id = ?
  `)
  stmt.run(
    task.title,
    task.description || null,
    task.listId || null,
    JSON.stringify(task.tags || []),
    task.priority || 'none',
    task.dueDate || null,
    task.completed ? 1 : 0,
    task.recurrenceRule || null,
    new Date().toISOString(),
    task.manualQuadrant || null,
    task.id
  )
  return task
})

ipcMain.handle('db:tasks:delete', (_, id: string) => {
  const db = getDatabase()
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return true
})

// Lists
ipcMain.handle('db:lists:getAll', () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM lists ORDER BY sortOrder ASC').all()
})

ipcMain.handle('db:lists:create', (_, list: List) => {
  const db = getDatabase()
  const stmt = db.prepare('INSERT INTO lists (id, name, color, icon, sortOrder) VALUES (?, ?, ?, ?, ?)')
  stmt.run(list.id, list.name, list.color || '#6b7280', list.icon || 'list', list.sortOrder || 0)
  return list
})

ipcMain.handle('db:lists:update', (_, list: List) => {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE lists SET name = ?, color = ?, icon = ?, sortOrder = ? WHERE id = ?')
  stmt.run(list.name, list.color, list.icon, list.sortOrder, list.id)
  return list
})

ipcMain.handle('db:lists:delete', (_, id: string) => {
  const db = getDatabase()
  db.prepare('DELETE FROM lists WHERE id = ?').run(id)
  return true
})

// Tags
ipcMain.handle('db:tags:getAll', () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all()
})

ipcMain.handle('db:tags:create', (_, tag: Tag) => {
  const db = getDatabase()
  const stmt = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
  stmt.run(tag.id, tag.name, tag.color || '#6b7280')
  return tag
})

ipcMain.handle('db:tags:update', (_, tag: Tag) => {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?')
  stmt.run(tag.name, tag.color, tag.id)
  return tag
})

ipcMain.handle('db:tags:delete', (_, id: string) => {
  const db = getDatabase()
  db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  return true
})

// Settings
ipcMain.handle('db:settings:get', () => {
  const db = getDatabase()
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  if (settings) {
    return {
      ...settings,
      autoApplyTags: JSON.parse(settings.autoApplyTags || '[]')
    }
  }
  return null
})

ipcMain.handle('db:settings:update', (_, settings: Settings) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE settings SET
      defaultPriority = ?,
      defaultDueDateRule = ?,
      defaultReminder = ?,
      autoApplyTags = ?,
      theme = ?
    WHERE id = 1
  `)
  stmt.run(
    settings.defaultPriority,
    settings.defaultDueDateRule,
    settings.defaultReminder,
    JSON.stringify(settings.autoApplyTags || []),
    settings.theme
  )
  return settings
})

// Eisenhower Rules
ipcMain.handle('db:rules:getAll', () => {
  const db = getDatabase()
  const rules = db.prepare('SELECT * FROM eisenhower_rules ORDER BY quadrant ASC').all()
  return rules.map(rule => ({
    ...rule,
    conditions: JSON.parse(rule.conditions || '[]')
  }))
})

ipcMain.handle('db:rules:update', (_, rules: EisenhowerRule[]) => {
  const db = getDatabase()
  const deleteStmt = db.prepare('DELETE FROM eisenhower_rules')
  const insertStmt = db.prepare(`
    INSERT INTO eisenhower_rules (id, quadrant, name, conditions, logic)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  db.transaction(() => {
    deleteStmt.run()
    for (const rule of rules) {
      insertStmt.run(rule.id, rule.quadrant, rule.name, JSON.stringify(rule.conditions), rule.logic)
    }
  })()
  
  return rules
})

// Notifications
ipcMain.handle('notification:show', (_, { title, body, taskId }: { title: string; body: string; taskId: string }) => {
  const notification = new Notification({
    title,
    body,
    silent: false,
  })
  
  notification.on('click', () => {
    mainWindow?.webContents.send('notification-clicked', taskId)
    mainWindow?.focus()
  })
  
  notification.show()
  return true
})

// Reminder scheduler
let reminderInterval: NodeJS.Timeout | null = null

function startReminderScheduler() {
  if (reminderInterval) clearInterval(reminderInterval)
  
  reminderInterval = setInterval(() => {
    checkReminders()
  }, 60000) // Check every minute
  
  // Also check immediately
  checkReminders()
}

function checkReminders() {
  const db = getDatabase()
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000)
  
  const tasks = db.prepare(`
    SELECT * FROM tasks 
    WHERE completed = 0 
    AND dueDate IS NOT NULL 
    AND dueDate <= ?
    AND dueDate >= ?
  `).all(fiveMinutesFromNow.toISOString(), now.toISOString())
  
  for (const task of tasks) {
    const notification = new Notification({
      title: '⏰ Task Reminder',
      body: task.title,
      silent: false,
    })
    
    notification.on('click', () => {
      mainWindow?.webContents.send('notification-clicked', task.id)
      mainWindow?.focus()
    })
    
    notification.show()
  }
}


