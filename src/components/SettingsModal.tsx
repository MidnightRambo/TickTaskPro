import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Priority, TickTaskProBackup } from '../types'
import { DEFAULT_DUE_DATE_PRESETS } from '../types'
import {
  XMarkIcon,
  Cog6ToothIcon,
  TagIcon,
  CalendarIcon,
  FlagIcon,
  BellIcon,
  PaintBrushIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
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
  const { setSettingsOpen, settings, updateSettings, tags, tasks, lists, rules, loadAll } = useStore()
  
  const [defaultPriority, setDefaultPriority] = useState<Priority>('none')
  const [defaultDueDateRule, setDefaultDueDateRule] = useState('none')
  const [defaultReminder, setDefaultReminder] = useState('none')
  const [autoApplyTags, setAutoApplyTags] = useState<string[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  // Backup state
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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

  // Export backup
  const handleExport = async () => {
    if (!settings) return
    setIsExporting(true)
    setBackupStatus({ type: null, message: '' })
    
    try {
      const backup: TickTaskProBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks,
        lists,
        tags,
        settings,
        rules,
      }
      
      const result = await window.electronAPI.backup.export(backup)
      
      if (result.cancelled) {
        setBackupStatus({ type: null, message: '' })
      } else if (result.success) {
        setBackupStatus({ type: 'success', message: 'Backup exported successfully!' })
      } else {
        setBackupStatus({ type: 'error', message: result.error || 'Export failed' })
      }
    } catch (error) {
      setBackupStatus({ type: 'error', message: String(error) })
    } finally {
      setIsExporting(false)
    }
  }

  // Import backup
  const handleImport = async () => {
    setIsImporting(true)
    setBackupStatus({ type: null, message: '' })
    
    try {
      // Step 1: Open file dialog and read backup
      const importResult = await window.electronAPI.backup.import()
      
      if (importResult.cancelled) {
        setBackupStatus({ type: null, message: '' })
        setIsImporting(false)
        return
      }
      
      if (!importResult.success || !importResult.data) {
        setBackupStatus({ type: 'error', message: importResult.error || 'Invalid backup file' })
        setIsImporting(false)
        return
      }
      
      const backup = importResult.data
      
      // Step 2: Confirm overwrite
      const confirmed = window.confirm(
        `Importing this backup will replace all your current data:\n\n` +
        `• ${backup.tasks.length} tasks\n` +
        `• ${backup.lists.length} lists\n` +
        `• ${backup.tags.length} tags\n\n` +
        `Backup created: ${new Date(backup.exportedAt).toLocaleString()}\n\n` +
        `This action cannot be undone. Continue?`
      )
      
      if (!confirmed) {
        setBackupStatus({ type: null, message: '' })
        setIsImporting(false)
        return
      }
      
      // Step 3: Restore the data
      const restoreResult = await window.electronAPI.backup.restore(backup)
      
      if (restoreResult.success) {
        // Reload all data from database
        await loadAll()
        setBackupStatus({ type: 'success', message: 'Backup imported successfully! Data has been restored.' })
      } else {
        setBackupStatus({ type: 'error', message: restoreResult.error || 'Restore failed' })
      }
    } catch (error) {
      setBackupStatus({ type: 'error', message: String(error) })
    } finally {
      setIsImporting(false)
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

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Backup & Restore */}
          <div>
            <label className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Backup & Restore
            </label>
            <p className="text-xs text-surface-500 mb-4">
              Export your data to a file for backup, or restore from a previous backup.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting || isImporting}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export data'}
              </button>
              <button
                onClick={handleImport}
                disabled={isExporting || isImporting}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import data'}
              </button>
            </div>
            
            {/* Status message */}
            {backupStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${
                  backupStatus.type === 'success'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {backupStatus.type === 'success' ? (
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                )}
                {backupStatus.message}
              </motion.div>
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


