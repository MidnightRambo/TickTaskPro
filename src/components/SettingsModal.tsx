import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Priority } from '../types'
import { DEFAULT_DUE_DATE_PRESETS } from '../types'
import {
  XMarkIcon,
  Cog6ToothIcon,
  TagIcon,
  CalendarIcon,
  FlagIcon,
  BellIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: '0', label: 'At due time' },
  { value: '5', label: '5 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
]

export function SettingsModal() {
  const { setSettingsOpen, settings, updateSettings, tags } = useStore()
  
  const [defaultPriority, setDefaultPriority] = useState<Priority>('none')
  const [defaultDueDateRule, setDefaultDueDateRule] = useState('none')
  const [defaultReminder, setDefaultReminder] = useState('none')
  const [autoApplyTags, setAutoApplyTags] = useState<string[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Load current settings
  useEffect(() => {
    if (settings) {
      setDefaultPriority(settings.defaultPriority)
      setDefaultDueDateRule(settings.defaultDueDateRule)
      setDefaultReminder(settings.defaultReminder)
      setAutoApplyTags(settings.autoApplyTags)
      setTheme(settings.theme)
    }
  }, [settings])

  const handleSave = async () => {
    await updateSettings({
      defaultPriority,
      defaultDueDateRule,
      defaultReminder,
      autoApplyTags,
      theme,
    })
    setSettingsOpen(false)
  }

  const toggleAutoTag = (tagName: string) => {
    if (autoApplyTags.includes(tagName)) {
      setAutoApplyTags(autoApplyTags.filter(t => t !== tagName))
    } else {
      setAutoApplyTags([...autoApplyTags, tagName])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-surface-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Theme */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <PaintBrushIcon className="w-4 h-4" />
              Theme
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`
                  flex-1 p-4 rounded-xl border-2 transition-all
                  ${theme === 'dark' 
                    ? 'border-brand-500 bg-brand-500/10' 
                    : 'border-white/10 hover:border-white/30'
                  }
                `}
              >
                <div className="w-full h-16 rounded-lg bg-surface-950 mb-2" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`
                  flex-1 p-4 rounded-xl border-2 transition-all
                  ${theme === 'light' 
                    ? 'border-brand-500 bg-brand-500/10' 
                    : 'border-white/10 hover:border-white/30'
                  }
                `}
              >
                <div className="w-full h-16 rounded-lg bg-white mb-2" />
                <span className="text-sm font-medium">Light</span>
              </button>
            </div>
          </div>

          {/* Default Priority */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <FlagIcon className="w-4 h-4" />
              Default Priority
            </label>
            <p className="text-xs text-surface-500 mb-2">
              New tasks will be created with this priority
            </p>
            <select
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value as Priority)}
              className="w-full"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Due Date */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Default Due Date
            </label>
            <p className="text-xs text-surface-500 mb-2">
              Auto-apply this due date when no date is specified
            </p>
            <select
              value={defaultDueDateRule}
              onChange={(e) => setDefaultDueDateRule(e.target.value)}
              className="w-full"
            >
              {DEFAULT_DUE_DATE_PRESETS.map(preset => (
                <option key={preset.id} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Reminder */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <BellIcon className="w-4 h-4" />
              Default Reminder
            </label>
            <p className="text-xs text-surface-500 mb-2">
              Auto-apply reminder to new tasks with due dates
            </p>
            <select
              value={defaultReminder}
              onChange={(e) => setDefaultReminder(e.target.value)}
              className="w-full"
            >
              {REMINDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Apply Tags */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Auto-Apply Tags
            </label>
            <p className="text-xs text-surface-500 mb-2">
              These tags will be automatically added to all new tasks
            </p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleAutoTag(tag.name)}
                    className={`
                      tag transition-all
                      ${autoApplyTags.includes(tag.name) 
                        ? 'ring-2 ring-brand-500' 
                        : 'opacity-60 hover:opacity-100'
                      }
                    `}
                    style={{ 
                      backgroundColor: tag.color + '20',
                      color: tag.color
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 italic">
                No tags created yet
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
          <button
            onClick={() => setSettingsOpen(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


