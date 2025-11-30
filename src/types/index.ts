// Task Priority
export type Priority = 'none' | 'low' | 'medium' | 'high'

// Eisenhower Quadrant
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate'

// Task Model
export interface Task {
  id: string
  title: string
  description?: string
  listId?: string
  tags: string[]
  priority: Priority
  dueDate?: string
  completed: boolean
  recurrenceRule?: string
  createdAt: string
  updatedAt: string
  manualQuadrant?: Quadrant
  reminderAt?: string
}

// List Model
export interface List {
  id: string
  name: string
  color: string
  icon: string
  sortOrder: number
}

// Tag Model
export interface Tag {
  id: string
  name: string
  color: string
}

// Settings Model
export interface Settings {
  defaultPriority: Priority
  defaultDueDateRule: string
  defaultReminder: string
  autoApplyTags: string[]
  theme: 'dark' | 'light'
}

// Rule Condition Types
export type ConditionType = 'priority' | 'dueDate' | 'tag' | 'list' | 'status'
export type ConditionOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'in' 
  | 'notIn' 
  | 'within' 
  | 'after' 
  | 'before' 
  | 'overdue' 
  | 'noDueDate'
  | 'contains'
  | 'notContains'

export interface RuleCondition {
  type: ConditionType
  operator: ConditionOperator
  value: string | string[] | number
}

// Eisenhower Rule
export interface EisenhowerRule {
  id: string
  quadrant: Quadrant
  name: string
  conditions: RuleCondition[]
  logic: 'AND' | 'OR'
}

// View Types
export type ViewMode = 'matrix' | 'list' | 'calendar'

// Filter Types
export interface TaskFilter {
  search?: string
  tags?: string[]
  listId?: string
  priority?: Priority[]
  dueDate?: 'today' | 'thisWeek' | 'upcoming' | 'overdue' | 'noDue'
  completed?: boolean
}

// Due Date Presets
export interface DueDatePreset {
  id: string
  label: string
  value: string // Rule string like "tomorrow 12:00", "end of week", etc.
}

export const DEFAULT_DUE_DATE_PRESETS: DueDatePreset[] = [
  { id: 'none', label: 'No due date', value: 'none' },
  { id: 'today', label: 'Today', value: 'today 17:00' },
  { id: 'tomorrow', label: 'Tomorrow 12:00', value: 'tomorrow 12:00' },
  { id: 'end-of-week', label: 'End of Week', value: 'friday 17:00' },
  { id: 'next-week', label: 'Next Monday', value: 'next monday 09:00' },
  { id: 'next-business-day', label: 'Next Business Day', value: 'next weekday' },
]

// Quadrant metadata
export const QUADRANT_META: Record<Quadrant, { label: string; color: string; description: string }> = {
  do: {
    label: 'Do First',
    color: 'bg-red-500',
    description: 'Urgent & Important',
  },
  schedule: {
    label: 'Schedule',
    color: 'bg-blue-500',
    description: 'Important, Not Urgent',
  },
  delegate: {
    label: 'Delegate',
    color: 'bg-amber-500',
    description: 'Urgent, Not Important',
  },
  eliminate: {
    label: 'Eliminate',
    color: 'bg-gray-500',
    description: 'Neither Urgent nor Important',
  },
}

// Backup / Export data structure
export interface TickTaskProBackup {
  version: number
  exportedAt: string
  tasks: Task[]
  lists: List[]
  tags: Tag[]
  settings: Settings
  rules: EisenhowerRule[]
}

// Backup operation result
export interface BackupResult {
  success: boolean
  cancelled?: boolean
  filePath?: string
  error?: string
  data?: TickTaskProBackup
}

// Window API type declaration
declare global {
  interface Window {
    electronAPI: {
      tasks: {
        getAll: () => Promise<Task[]>
        getById: (id: string) => Promise<Task | null>
        create: (task: Task) => Promise<Task>
        update: (task: Task) => Promise<Task>
        delete: (id: string) => Promise<boolean>
      }
      lists: {
        getAll: () => Promise<List[]>
        create: (list: List) => Promise<List>
        update: (list: List) => Promise<List>
        delete: (id: string) => Promise<boolean>
      }
      tags: {
        getAll: () => Promise<Tag[]>
        create: (tag: Tag) => Promise<Tag>
        update: (tag: Tag) => Promise<Tag>
        delete: (id: string) => Promise<boolean>
      }
      settings: {
        get: () => Promise<Settings | null>
        update: (settings: Settings) => Promise<Settings>
      }
      rules: {
        getAll: () => Promise<EisenhowerRule[]>
        update: (rules: EisenhowerRule[]) => Promise<EisenhowerRule[]>
      }
      notification: {
        show: (options: { title: string; body: string; taskId: string }) => Promise<boolean>
      }
      backup: {
        export: (data: TickTaskProBackup) => Promise<BackupResult>
        import: () => Promise<BackupResult>
        restore: (data: TickTaskProBackup) => Promise<BackupResult>
      }
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      removeListener: (channel: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

export {}


