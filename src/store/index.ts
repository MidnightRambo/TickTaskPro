import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as chrono from 'chrono-node'
import type { Task, List, Tag, Settings, EisenhowerRule, TaskFilter, ViewMode, Quadrant, Priority } from '../types'
import { calculateNextOccurrence } from '../utils/date'

interface AppState {
  // Data
  tasks: Task[]
  lists: List[]
  tags: Tag[]
  settings: Settings | null
  rules: EisenhowerRule[]
  
  // UI State
  viewMode: ViewMode
  filter: TaskFilter
  selectedTaskId: string | null
  isQuickAddOpen: boolean
  isSettingsOpen: boolean
  isRulesEditorOpen: boolean
  isTagManagerOpen: boolean
  sidebarCollapsed: boolean
  
  // Actions - Data Loading
  loadAll: () => Promise<void>
  
  // Actions - Tasks
  createTask: (title: string, defaults?: Partial<Task>) => Promise<Task>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  
  // Actions - Lists
  createList: (name: string, color?: string) => Promise<List>
  updateList: (list: List) => Promise<void>
  deleteList: (id: string) => Promise<void>
  
  // Actions - Tags
  createTag: (name: string, color?: string) => Promise<Tag>
  updateTag: (tag: Tag) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  
  // Actions - Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  
  // Actions - Rules
  updateRules: (rules: EisenhowerRule[]) => Promise<void>
  
  // Actions - UI
  setViewMode: (mode: ViewMode) => void
  setFilter: (filter: TaskFilter) => void
  selectTask: (id: string | null) => void
  setQuickAddOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setRulesEditorOpen: (open: boolean) => void
  setTagManagerOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Computed
  getTasksByQuadrant: () => Record<Quadrant, Task[]>
  getFilteredTasks: () => Task[]
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  tasks: [],
  lists: [],
  tags: [],
  settings: null,
  rules: [],
  viewMode: 'matrix',
  filter: {},
  selectedTaskId: null,
  isQuickAddOpen: false,
  isSettingsOpen: false,
  isRulesEditorOpen: false,
  isTagManagerOpen: false,
  sidebarCollapsed: false,
  
  // Load all data from database
  loadAll: async () => {
    try {
      const [tasks, lists, tags, settings, rules] = await Promise.all([
        window.electronAPI.tasks.getAll(),
        window.electronAPI.lists.getAll(),
        window.electronAPI.tags.getAll(),
        window.electronAPI.settings.get(),
        window.electronAPI.rules.getAll(),
      ])
      
      // Parse tags JSON for tasks
      const parsedTasks = tasks.map(task => ({
        ...task,
        tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
        completed: Boolean(task.completed),
      }))
      
      set({
        tasks: parsedTasks,
        lists,
        tags,
        settings,
        rules,
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  },
  
  // Task actions
  createTask: async (title: string, defaults?: Partial<Task>) => {
    const { settings, tags: allTags } = get()
    const now = new Date().toISOString()
    
    // Parse inline tags from title (#tag1 #tag2)
    const tagRegex = /#(\w+)/g
    const inlineTags: string[] = []
    let cleanTitle = title
    let match
    
    while ((match = tagRegex.exec(title)) !== null) {
      inlineTags.push(match[1])
      cleanTitle = cleanTitle.replace(match[0], '').trim()
    }
    
    // Parse due date from title using chrono-node
    let dueDate: string | undefined = undefined
    const parsed = chrono.parse(cleanTitle)
    if (parsed.length > 0) {
      dueDate = parsed[0].date().toISOString()
      cleanTitle = cleanTitle.replace(parsed[0].text, '').trim()
    }
    
    // Apply default due date if none parsed and settings have one
    if (!dueDate && settings?.defaultDueDateRule && settings.defaultDueDateRule !== 'none') {
      const defaultParsed = chrono.parse(settings.defaultDueDateRule)
      if (defaultParsed.length > 0) {
        dueDate = defaultParsed[0].date().toISOString()
      }
    }
    
    // Create or find tags
    const taskTags: string[] = [...inlineTags]
    if (settings?.autoApplyTags) {
      taskTags.push(...settings.autoApplyTags)
    }
    
    // Ensure all inline tags exist
    for (const tagName of inlineTags) {
      const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
      if (!existingTag) {
        await get().createTag(tagName)
      }
    }
    
    const task: Task = {
      id: uuidv4(),
      title: cleanTitle,
      tags: [...new Set(taskTags)],
      priority: defaults?.priority || settings?.defaultPriority || 'none',
      dueDate: defaults?.dueDate || dueDate,
      completed: false,
      createdAt: now,
      updatedAt: now,
      listId: defaults?.listId,
      description: defaults?.description,
      ...defaults,
    }
    
    const created = await window.electronAPI.tasks.create(task)
    set(state => ({ tasks: [created, ...state.tasks] }))
    return created
  },
  
  updateTask: async (task: Task) => {
    const updated = { ...task, updatedAt: new Date().toISOString() }
    await window.electronAPI.tasks.update(updated)
    set(state => ({
      tasks: state.tasks.map(t => t.id === task.id ? updated : t)
    }))
  },
  
  deleteTask: async (id: string) => {
    await window.electronAPI.tasks.delete(id)
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }))
  },
  
  toggleTaskComplete: async (id: string) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    
    const wasCompleted = task.completed
    const willBeCompleted = !wasCompleted
    
    // Update the current task
    await get().updateTask({ ...task, completed: willBeCompleted })
    
    // If completing a recurring task, create the next occurrence
    if (willBeCompleted && task.recurrenceRule) {
      const nextDueDate = calculateNextOccurrence(task.dueDate, task.recurrenceRule)
      
      if (nextDueDate) {
        const now = new Date().toISOString()
        const nextTask: Task = {
          id: uuidv4(),
          title: task.title,
          description: task.description,
          listId: task.listId,
          tags: [...task.tags],
          priority: task.priority,
          dueDate: nextDueDate,
          completed: false,
          recurrenceRule: task.recurrenceRule,
          createdAt: now,
          updatedAt: now,
          manualQuadrant: task.manualQuadrant,
        }
        
        // Create the next occurrence in the database
        const created = await window.electronAPI.tasks.create(nextTask)
        set(state => ({ tasks: [created, ...state.tasks] }))
      }
    }
  },
  
  // List actions
  createList: async (name: string, color = '#6b7280') => {
    const list: List = {
      id: uuidv4(),
      name,
      color,
      icon: 'list',
      sortOrder: get().lists.length,
    }
    const created = await window.electronAPI.lists.create(list)
    set(state => ({ lists: [...state.lists, created] }))
    return created
  },
  
  updateList: async (list: List) => {
    await window.electronAPI.lists.update(list)
    set(state => ({
      lists: state.lists.map(l => l.id === list.id ? list : l)
    }))
  },
  
  deleteList: async (id: string) => {
    await window.electronAPI.lists.delete(id)
    set(state => ({
      lists: state.lists.filter(l => l.id !== id),
      filter: state.filter.listId === id ? { ...state.filter, listId: undefined } : state.filter,
    }))
  },
  
  // Tag actions
  createTag: async (name: string, color = '#6b7280') => {
    const tag: Tag = {
      id: uuidv4(),
      name,
      color,
    }
    const created = await window.electronAPI.tags.create(tag)
    set(state => ({ tags: [...state.tags, created] }))
    return created
  },
  
  updateTag: async (tag: Tag) => {
    await window.electronAPI.tags.update(tag)
    set(state => ({
      tags: state.tags.map(t => t.id === tag.id ? tag : t)
    }))
  },
  
  deleteTag: async (id: string) => {
    await window.electronAPI.tags.delete(id)
    set(state => ({
      tags: state.tags.filter(t => t.id !== id)
    }))
  },
  
  // Settings actions
  updateSettings: async (partial: Partial<Settings>) => {
    const current = get().settings
    if (!current) return
    
    const updated = { ...current, ...partial }
    await window.electronAPI.settings.update(updated)
    set({ settings: updated })
    
    // Apply theme
    if (partial.theme) {
      document.documentElement.classList.toggle('dark', partial.theme === 'dark')
    }
  },
  
  // Rules actions
  updateRules: async (rules: EisenhowerRule[]) => {
    await window.electronAPI.rules.update(rules)
    set({ rules })
  },
  
  // UI actions
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setFilter: (filter: TaskFilter) => set({ filter }),
  selectTask: (id: string | null) => set({ selectedTaskId: id }),
  setQuickAddOpen: (open: boolean) => set({ isQuickAddOpen: open }),
  setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
  setRulesEditorOpen: (open: boolean) => set({ isRulesEditorOpen: open }),
  setTagManagerOpen: (open: boolean) => set({ isTagManagerOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  // Computed: Get tasks grouped by quadrant based on rules
  getTasksByQuadrant: () => {
    const { tasks, rules } = get()
    const incompleteTasks = tasks.filter(t => !t.completed)
    
    const result: Record<Quadrant, Task[]> = {
      do: [],
      schedule: [],
      delegate: [],
      eliminate: [],
    }
    
    for (const task of incompleteTasks) {
      // If task has manual quadrant override, use it
      if (task.manualQuadrant) {
        result[task.manualQuadrant].push(task)
        continue
      }
      
      // Otherwise evaluate rules
      let assigned = false
      for (const rule of rules) {
        if (evaluateRule(task, rule)) {
          result[rule.quadrant].push(task)
          assigned = true
          break
        }
      }
      
      // Default to eliminate if no rule matches
      if (!assigned) {
        result.eliminate.push(task)
      }
    }
    
    return result
  },
  
  // Computed: Get filtered tasks
  getFilteredTasks: () => {
    const { tasks, filter } = get()
    
    return tasks.filter(task => {
      // Search filter
      if (filter.search) {
        const search = filter.search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(search)
        const matchesTags = task.tags.some(t => t.toLowerCase().includes(search.replace('#', '')))
        if (!matchesTitle && !matchesTags) return false
      }
      
      // Tag filter
      if (filter.tags?.length) {
        if (!filter.tags.some(t => task.tags.includes(t))) return false
      }
      
      // List filter
      if (filter.listId && task.listId !== filter.listId) return false
      
      // Priority filter
      if (filter.priority?.length && !filter.priority.includes(task.priority)) return false
      
      // Due date filter
      if (filter.dueDate) {
        const now = new Date()
        const taskDue = task.dueDate ? new Date(task.dueDate) : null
        
        switch (filter.dueDate) {
          case 'today':
            if (!taskDue || taskDue.toDateString() !== now.toDateString()) return false
            break
          case 'upcoming':
            if (!taskDue || taskDue <= now) return false
            break
          case 'overdue':
            if (!taskDue || taskDue >= now) return false
            break
          case 'noDue':
            if (taskDue) return false
            break
        }
      }
      
      // Completed filter
      if (filter.completed !== undefined && task.completed !== filter.completed) return false
      
      return true
    })
  },
}))

// Helper: Evaluate if a task matches a rule
function evaluateRule(task: Task, rule: EisenhowerRule): boolean {
  const results = rule.conditions.map(condition => evaluateCondition(task, condition))
  
  if (rule.logic === 'AND') {
    return results.every(Boolean)
  } else {
    return results.some(Boolean)
  }
}

// Helper: Evaluate a single condition
function evaluateCondition(task: Task, condition: { type: string; operator: string; value: string | string[] | number }): boolean {
  const now = new Date()
  const taskDue = task.dueDate ? new Date(task.dueDate) : null
  
  switch (condition.type) {
    case 'priority':
      switch (condition.operator) {
        case 'equals':
          return task.priority === condition.value
        case 'notEquals':
          return task.priority !== condition.value
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(task.priority)
        case 'notIn':
          return Array.isArray(condition.value) && !condition.value.includes(task.priority)
      }
      break
      
    case 'dueDate':
      switch (condition.operator) {
        case 'within': {
          if (!taskDue) return false
          const days = Number(condition.value)
          const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
          return taskDue <= limit && taskDue >= now
        }
        case 'after': {
          if (!taskDue) return false
          const days = Number(condition.value)
          const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
          return taskDue > limit
        }
        case 'before': {
          if (!taskDue) return false
          const days = Number(condition.value)
          const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
          return taskDue < limit
        }
        case 'overdue':
          return taskDue !== null && taskDue < now
        case 'noDueDate':
          return taskDue === null
      }
      break
      
    case 'tag':
      switch (condition.operator) {
        case 'contains':
          return Array.isArray(condition.value) 
            ? condition.value.some(v => task.tags.includes(v))
            : task.tags.includes(String(condition.value))
        case 'notContains':
          return Array.isArray(condition.value)
            ? !condition.value.some(v => task.tags.includes(v))
            : !task.tags.includes(String(condition.value))
      }
      break
      
    case 'list':
      switch (condition.operator) {
        case 'equals':
          return task.listId === condition.value
        case 'notEquals':
          return task.listId !== condition.value
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(task.listId || '')
      }
      break
      
    case 'status':
      switch (condition.operator) {
        case 'equals':
          return condition.value === 'completed' ? task.completed : !task.completed
      }
      break
  }
  
  return false
}


