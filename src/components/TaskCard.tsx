import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Task } from '../types'
import { formatDistanceToNow, format, isPast, isToday } from '../utils/date'
import {
  CheckIcon,
  CalendarIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

const PRIORITY_STYLES = {
  high: 'border-l-red-500 bg-red-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-green-500 bg-green-500/5',
  none: 'border-l-surface-600 bg-white/5',
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { toggleTaskComplete, selectTask, tags: allTags, lists } = useStore()

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completed
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate))
  const list = lists.find(l => l.id === task.listId)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskComplete(task.id)
  }

  return (
    <motion.div
      onClick={() => selectTask(task.id)}
      className={`
        task-card group cursor-pointer rounded-xl p-3
        border-l-4 ${PRIORITY_STYLES[task.priority]}
        border border-white/10 hover:border-white/20
        ${isDragging ? 'shadow-xl ring-2 ring-brand-500/50' : 'shadow-card'}
        ${task.completed ? 'opacity-60' : ''}
      `}
      whileHover={{ scale: isDragging ? 1 : 1.01 }}
      layout
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={`
            checkbox-wrapper flex-shrink-0 mt-0.5
            ${task.completed ? 'checked' : ''}
          `}
        >
          <CheckIcon className="checkmark w-3 h-3 text-white" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-medium leading-tight truncate
            ${task.completed ? 'line-through text-surface-500' : ''}
          `}>
            {task.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Due date */}
            {task.dueDate && (
              <span className={`
                flex items-center gap-1 text-xs
                ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-surface-500'}
              `}>
                <CalendarIcon className="w-3 h-3" />
                {isDueToday 
                  ? format(new Date(task.dueDate), 'h:mm a')
                  : formatDistanceToNow(new Date(task.dueDate))
                }
              </span>
            )}

            {/* Recurrence */}
            {task.recurrenceRule && (
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <ArrowPathIcon className="w-3 h-3" />
              </span>
            )}

            {/* List badge */}
            {list && (
              <span 
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ 
                  backgroundColor: list.color + '20',
                  color: list.color 
                }}
              >
                {list.name}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.tags.slice(0, 3).map(tagName => {
                const tag = allTags.find(t => t.name === tagName)
                return (
                  <span
                    key={tagName}
                    className="tag"
                    style={{ 
                      backgroundColor: (tag?.color || '#6b7280') + '20',
                      color: tag?.color || '#6b7280'
                    }}
                  >
                    #{tagName}
                  </span>
                )
              })}
              {task.tags.length > 3 && (
                <span className="text-xs text-surface-500">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Manual override indicator */}
        {task.manualQuadrant && (
          <div 
            className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0"
            title="Manually placed"
          />
        )}
      </div>
    </motion.div>
  )
}


