import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'ticktask.db')
  
  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  runMigrations(db)
  seedDefaults(db)
  
  return db
}

function runMigrations(db: Database.Database) {
  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    )
  `)
  
  const migrations: Array<{ name: string; sql: string }> = [
    {
      name: '001_initial_schema',
      sql: `
        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          listId TEXT,
          tags TEXT DEFAULT '[]',
          priority TEXT DEFAULT 'none' CHECK(priority IN ('none', 'low', 'medium', 'high')),
          dueDate TEXT,
          completed INTEGER DEFAULT 0,
          recurrenceRule TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          manualQuadrant TEXT CHECK(manualQuadrant IN (NULL, 'do', 'schedule', 'delegate', 'eliminate'))
        );
        
        -- Lists table
        CREATE TABLE IF NOT EXISTS lists (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#6b7280',
          icon TEXT DEFAULT 'list',
          sortOrder INTEGER DEFAULT 0
        );
        
        -- Tags table
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT DEFAULT '#6b7280'
        );
        
        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          defaultPriority TEXT DEFAULT 'none',
          defaultDueDateRule TEXT DEFAULT 'none',
          defaultReminder TEXT DEFAULT 'none',
          autoApplyTags TEXT DEFAULT '[]',
          theme TEXT DEFAULT 'dark'
        );
        
        -- Eisenhower rules table
        CREATE TABLE IF NOT EXISTS eisenhower_rules (
          id TEXT PRIMARY KEY,
          quadrant TEXT NOT NULL CHECK(quadrant IN ('do', 'schedule', 'delegate', 'eliminate')),
          name TEXT NOT NULL,
          conditions TEXT DEFAULT '[]',
          logic TEXT DEFAULT 'AND' CHECK(logic IN ('AND', 'OR'))
        );
        
        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_tasks_listId ON tasks(listId);
        CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate);
        CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      `
    },
    {
      name: '002_add_reminder_field',
      sql: `
        ALTER TABLE tasks ADD COLUMN reminderAt TEXT;
      `
    }
  ]
  
  const appliedMigrations = db.prepare('SELECT name FROM migrations').all().map(m => m.name)
  
  for (const migration of migrations) {
    if (!appliedMigrations.includes(migration.name)) {
      console.log(`Applying migration: ${migration.name}`)
      db.exec(migration.sql)
      db.prepare('INSERT INTO migrations (name, appliedAt) VALUES (?, ?)').run(
        migration.name,
        new Date().toISOString()
      )
    }
  }
}

function seedDefaults(db: Database.Database) {
  // Seed default settings if not exists
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  if (!settings) {
    db.prepare(`
      INSERT INTO settings (id, defaultPriority, defaultDueDateRule, defaultReminder, autoApplyTags, theme)
      VALUES (1, 'none', 'none', 'none', '[]', 'dark')
    `).run()
  }
  
  // Seed default Eisenhower rules if none exist
  const rulesCount = db.prepare('SELECT COUNT(*) as count FROM eisenhower_rules').get()
  if (rulesCount.count === 0) {
    const defaultRules = [
      {
        id: 'rule-do',
        quadrant: 'do',
        name: 'Do First',
        conditions: JSON.stringify([
          { type: 'priority', operator: 'equals', value: 'high' },
          { type: 'dueDate', operator: 'within', value: '2' }
        ]),
        logic: 'OR'
      },
      {
        id: 'rule-schedule',
        quadrant: 'schedule',
        name: 'Schedule',
        conditions: JSON.stringify([
          { type: 'priority', operator: 'in', value: ['medium', 'high'] },
          { type: 'dueDate', operator: 'after', value: '2' }
        ]),
        logic: 'AND'
      },
      {
        id: 'rule-delegate',
        quadrant: 'delegate',
        name: 'Delegate',
        conditions: JSON.stringify([
          { type: 'priority', operator: 'equals', value: 'low' },
          { type: 'dueDate', operator: 'within', value: '7' }
        ]),
        logic: 'AND'
      },
      {
        id: 'rule-eliminate',
        quadrant: 'eliminate',
        name: 'Eliminate',
        conditions: JSON.stringify([
          { type: 'priority', operator: 'equals', value: 'none' }
        ]),
        logic: 'AND'
      }
    ]
    
    const stmt = db.prepare(`
      INSERT INTO eisenhower_rules (id, quadrant, name, conditions, logic)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    for (const rule of defaultRules) {
      stmt.run(rule.id, rule.quadrant, rule.name, rule.conditions, rule.logic)
    }
  }
  
  // Seed default lists if none exist
  const listsCount = db.prepare('SELECT COUNT(*) as count FROM lists').get()
  if (listsCount.count === 0) {
    const defaultLists = [
      { id: 'inbox', name: 'Inbox', color: '#3b82f6', icon: 'inbox', sortOrder: 0 },
      { id: 'work', name: 'Work', color: '#8b5cf6', icon: 'briefcase', sortOrder: 1 },
      { id: 'personal', name: 'Personal', color: '#22c55e', icon: 'home', sortOrder: 2 },
    ]
    
    const stmt = db.prepare('INSERT INTO lists (id, name, color, icon, sortOrder) VALUES (?, ?, ?, ?, ?)')
    for (const list of defaultLists) {
      stmt.run(list.id, list.name, list.color, list.icon, list.sortOrder)
    }
  }
}


