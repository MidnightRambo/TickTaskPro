import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useStore } from '../store'
import type { Priority, Quadrant } from '../types'
import { format, formatRelative } from '../utils/date'
import {
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  FlagIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-red-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'low', label: 'Low', color: 'text-green-500' },
  { value: 'none', label: 'None', color: 'text-surface-500' },
]

const QUADRANT_OPTIONS: { value: Quadrant | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Auto (by rules)' },
  { value: 'do', label: 'Do First' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'delegate', label: 'Delegate' },
  { value: 'eliminate', label: 'Eliminate' },
]

export function TaskDrawer() {
  const { 
    tasks, 
    selectedTaskId, 
    selectTask, 
    updateTask, 
    deleteTask,
    toggleTaskComplete,
    tags: allTags,
    lists,
    createTag,
  } = useStore()
  
  const task = tasks.find(t => t.id === selectedTaskId)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [listId, setListId] = useState<string | undefined>()
  const [taskTags, setTaskTags] = useState<string[]>([])
  const [manualQuadrant, setManualQuadrant] = useState<Quadrant | 'auto'>('auto')
  const [recurrenceRule, setRecurrenceRule] = useState('')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default
  const [newTag, setNewTag] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  const WEEKDAYS = [
    { value: 0, label: 'Sun', short: 'S' },
    { value: 1, label: 'Mon', short: 'M' },
    { value: 2, label: 'Tue', short: 'T' },
    { value: 3, label: 'Wed', short: 'W' },
    { value: 4, label: 'Thu', short: 'T' },
    { value: 5, label: 'Fri', short: 'F' },
    { value: 6, label: 'Sat', short: 'S' },
  ]

  // Sync local state with task
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setTaskTags(task.tags)
      setListId(task.listId)
      setManualQuadrant(task.manualQuadrant || 'auto')
      // Parse recurrence rule - handle weekdays:X,Y,Z format
      const rule = task.recurrenceRule || ''
      if (rule.startsWith('weekdays:')) {
        setRecurrenceRule('weekdays')
        const days = rule.replace('weekdays:', '').split(',').map(Number).filter(n => !isNaN(n))
        setSelectedWeekdays(days.length > 0 ? days : [1, 2, 3, 4, 5])
      } else {
        setRecurrenceRule(rule)
        if (rule === 'weekdays') {
          setSelectedWeekdays([1, 2, 3, 4, 5]) // Default Mon-Fri
        }
      }
      
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        setDueDate(format(date, 'yyyy-MM-dd'))
        setDueTime(format(date, 'HH:mm'))
      } else {
        setDueDate('')
        setDueTime('')
      }
    }
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    let dueDateISO: string | undefined = undefined
    if (dueDate) {
      const dateTime = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T12:00`
      dueDateISO = new Date(dateTime).toISOString()
    }

    // Format recurrence rule with weekdays if applicable
    let finalRecurrenceRule: string | undefined = recurrenceRule || undefined
    if (recurrenceRule === 'weekdays' && selectedWeekdays.length > 0) {
      finalRecurrenceRule = `weekdays:${selectedWeekdays.sort((a, b) => a - b).join(',')}`
    }

    await updateTask({
      ...task,
      title,
      description,
      priority,
      dueDate: dueDateISO,
      listId,
      tags: taskTags,
      manualQuadrant: manualQuadrant === 'auto' ? undefined : manualQuadrant,
      recurrenceRule: finalRecurrenceRule,
    })
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    
    const tagName = newTag.trim().replace(/^#/, '')
    
    // Create tag if it doesn't exist
    if (!allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      await createTag(tagName)
    }
    
    if (!taskTags.includes(tagName)) {
      setTaskTags([...taskTags, tagName])
    }
    setNewTag('')
  }

  const handleRemoveTag = (tagName: string) => {
    setTaskTags(taskTags.filter(t => t !== tagName))
  }

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id)
      selectTask(null) // Ensure drawer closes after deletion
    }
  }

  const handleClose = () => {
    selectTask(null)
  }

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (task) handleSave()
    }, 500)
    return () => clearTimeout(timeout)
  }, [title, description, priority, dueDate, dueTime, listId, taskTags, manualQuadrant, recurrenceRule, selectedWeekdays])

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="drawer w-[400px]"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 no-drag relative z-10">
          <h2 className="font-semibold">Task Details</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-lg text-surface-500 hover:text-red-500 hover:bg-white/10 transition-colors cursor-pointer relative z-10"
              aria-label="Delete task"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative z-10"
              aria-label="Close task details"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-none p-0 focus:ring-0"
              placeholder="Task title..."
            />
          </div>

          {/* Complete checkbox */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleTaskComplete(task.id)
              }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${task.completed 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/5 text-surface-400 hover:bg-white/10'
                }
              `}
            >
              <CheckIcon className="w-4 h-4" />
              {task.completed ? 'Completed' : 'Mark complete'}
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 block">
              Description
            </label>
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setIsEditingDescription(false)}
                rows={6}
                className="w-full text-sm"
                placeholder="Add description... (supports markdown)"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="min-h-[100px] p-3 rounded-lg bg-white/5 text-sm cursor-text hover:bg-white/10 transition-colors"
              >
                {description ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{description}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-surface-500">Add description...</span>
                )}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 flex items-center gap-2">
              <FlagIcon className="w-4 h-4" />
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${priority === option.value 
                      ? `${option.color} bg-white/10` 
                      : 'text-surface-500 hover:bg-white/5'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Due Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-28"
              />
            </div>
            {dueDate && (
              <p className="text-xs text-surface-500 mt-1">
                {formatRelative(new Date(`${dueDate}T${dueTime || '12:00'}`))}
              </p>
            )}
          </div>

          {/* List */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              List
            </label>
            <select
              value={listId || ''}
              onChange={(e) => setListId(e.target.value || undefined)}
              className="w-full"
            >
              <option value="">No list</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quadrant Override */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 block">
              Matrix Placement
            </label>
            <select
              value={manualQuadrant}
              onChange={(e) => setManualQuadrant(e.target.value as Quadrant | 'auto')}
              className="w-full"
            >
              {QUADRANT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {taskTags.map(tagName => {
                const tag = allTags.find(t => t.name === tagName)
                return (
                  <span
                    key={tagName}
                    className="tag group cursor-pointer"
                    style={{ 
                      backgroundColor: (tag?.color || '#6b7280') + '20',
                      color: tag?.color || '#6b7280'
                    }}
                    onClick={() => handleRemoveTag(tagName)}
                  >
                    #{tagName}
                    <XMarkIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </span>
                )
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add tag..."
                className="flex-1 text-sm"
              />
              <button
                onClick={handleAddTag}
                className="btn btn-secondary text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-2 flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4" />
              Recurrence
            </label>
            <select
              value={recurrenceRule}
              onChange={(e) => {
                setRecurrenceRule(e.target.value)
                // Reset to default weekdays when switching to weekdays option
                if (e.target.value === 'weekdays') {
                  setSelectedWeekdays([1, 2, 3, 4, 5])
                }
              }}
              className="w-full"
            >
              <option value="">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Specific weekdays</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
            
            {/* Weekday selector - shown when weekdays option is selected */}
            {recurrenceRule === 'weekdays' && (
              <div className="mt-3">
                <p className="text-xs text-surface-500 mb-2">Select which days this task should repeat:</p>
                <div className="flex gap-1">
                  {WEEKDAYS.map(day => {
                    const isSelected = selectedWeekdays.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Don't allow deselecting all days
                            if (selectedWeekdays.length > 1) {
                              setSelectedWeekdays(selectedWeekdays.filter(d => d !== day.value))
                            }
                          } else {
                            setSelectedWeekdays([...selectedWeekdays, day.value])
                          }
                        }}
                        className={`
                          w-9 h-9 rounded-lg text-xs font-medium transition-all
                          ${isSelected 
                            ? 'bg-brand-500 text-white' 
                            : 'bg-white/5 text-surface-400 hover:bg-white/10'
                          }
                        `}
                        title={day.label}
                      >
                        {day.short}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-xs text-surface-500">
          <p>Created {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}</p>
          <p>Updated {format(new Date(task.updatedAt), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>
    </motion.div>
  )
}


