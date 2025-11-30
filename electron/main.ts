import { app, BrowserWindow, ipcMain, Notification, globalShortcut, nativeImage, dialog, Menu } from 'electron'
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
  const isMac = process.platform === 'darwin'
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'TickTaskPro',
    // macOS-specific title bar styling
    ...(isMac ? {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 },
    } : {
      // Windows/Linux: hide the menu bar
      autoHideMenuBar: true,
    }),
    backgroundColor: '#09090b',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // On Windows/Linux, completely hide the menu bar
  if (!isMac) {
    mainWindow.setMenuBarVisibility(false)
    Menu.setApplicationMenu(null)
  }

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

// ============= BACKUP / EXPORT / IMPORT =============

interface TickTaskProBackup {
  version: number
  exportedAt: string
  tasks: Task[]
  lists: List[]
  tags: Tag[]
  settings: Settings
  rules: EisenhowerRule[]
}

// Export backup to file
ipcMain.handle('backup:export', async (_, backupData: TickTaskProBackup) => {
  const date = new Date().toISOString().split('T')[0]
  const defaultFilename = `ticktaskpro-backup-${date}.json`
  
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export TickTaskPro Backup',
    defaultPath: defaultFilename,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  })
  
  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true }
  }
  
  try {
    const jsonContent = JSON.stringify(backupData, null, 2)
    fs.writeFileSync(result.filePath, jsonContent, 'utf-8')
    return { success: true, filePath: result.filePath }
  } catch (error) {
    console.error('Backup export error:', error)
    return { success: false, error: String(error) }
  }
})

// Import backup from file
ipcMain.handle('backup:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import TickTaskPro Backup',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, cancelled: true }
  }
  
  try {
    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content) as TickTaskProBackup
    
    // Basic validation
    if (!data.version || !Array.isArray(data.tasks) || !Array.isArray(data.lists)) {
      return { success: false, error: 'Invalid backup file format' }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Backup import error:', error)
    return { success: false, error: String(error) }
  }
})

// Restore backup data (replace all current data)
ipcMain.handle('backup:restore', async (_, backupData: TickTaskProBackup) => {
  const db = getDatabase()
  
  try {
    db.transaction(() => {
      // Clear existing data
      db.prepare('DELETE FROM tasks').run()
      db.prepare('DELETE FROM lists').run()
      db.prepare('DELETE FROM tags').run()
      db.prepare('DELETE FROM eisenhower_rules').run()
      
      // Restore lists
      const insertList = db.prepare('INSERT INTO lists (id, name, color, icon, sortOrder) VALUES (?, ?, ?, ?, ?)')
      for (const list of backupData.lists) {
        insertList.run(list.id, list.name, list.color || '#6b7280', list.icon || 'list', list.sortOrder || 0)
      }
      
      // Restore tags
      const insertTag = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
      for (const tag of backupData.tags) {
        insertTag.run(tag.id, tag.name, tag.color || '#6b7280')
      }
      
      // Restore tasks
      const insertTask = db.prepare(`
        INSERT INTO tasks (id, title, description, listId, tags, priority, dueDate, completed, recurrenceRule, createdAt, updatedAt, manualQuadrant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const task of backupData.tasks) {
        insertTask.run(
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
      }
      
      // Restore rules
      const insertRule = db.prepare(`
        INSERT INTO eisenhower_rules (id, quadrant, name, conditions, logic)
        VALUES (?, ?, ?, ?, ?)
      `)
      for (const rule of backupData.rules || []) {
        insertRule.run(rule.id, rule.quadrant, rule.name, JSON.stringify(rule.conditions), rule.logic)
      }
      
      // Restore settings
      if (backupData.settings) {
        db.prepare(`
          UPDATE settings SET
            defaultPriority = ?,
            defaultDueDateRule = ?,
            defaultReminder = ?,
            autoApplyTags = ?,
            theme = ?
          WHERE id = 1
        `).run(
          backupData.settings.defaultPriority,
          backupData.settings.defaultDueDateRule,
          backupData.settings.defaultReminder,
          JSON.stringify(backupData.settings.autoApplyTags || []),
          backupData.settings.theme
        )
      }
    })()
    
    return { success: true }
  } catch (error) {
    console.error('Backup restore error:', error)
    return { success: false, error: String(error) }
  }
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


