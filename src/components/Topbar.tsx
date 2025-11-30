import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

export function Topbar() {
  const { 
    filter, 
    setFilter, 
    setQuickAddOpen, 
    setSettingsOpen,
    setRulesEditorOpen,
    settings,
    updateSettings,
    viewMode,
    setViewMode,
  } = useStore()
  
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleTheme = () => {
    updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-white/5 drag-region">
      {/* Spacer for macOS traffic lights */}
      <div className="w-16" />
      
      {/* Search Bar */}
      <motion.div 
        className="flex-1 max-w-xl relative no-drag"
        animate={{ scale: searchFocused ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search tasks... (⌘F)"
          value={filter.search || ''}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl
                     text-sm placeholder-surface-500 focus:bg-white/10 focus:border-brand-500/50
                     transition-all duration-200"
        />
        {filter.search && (
          <button
            onClick={() => setFilter({ ...filter, search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
          >
            ×
          </button>
        )}
      </motion.div>
      
      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 no-drag">
        <button
          onClick={() => setViewMode('matrix')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'matrix' 
              ? 'bg-brand-500 text-white' 
              : 'text-surface-400 hover:text-white'
          }`}
          title="Matrix View"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'list' 
              ? 'bg-brand-500 text-white' 
              : 'text-surface-400 hover:text-white'
          }`}
          title="List View"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Quick Add Button */}
      <motion.button
        onClick={() => setQuickAddOpen(true)}
        className="btn btn-primary no-drag"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <PlusIcon className="w-4 h-4" />
        <span className="hidden sm:inline">New Task</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white/20 rounded">
          ⌘N
        </kbd>
      </motion.button>
      
      {/* Rules Editor */}
      <button
        onClick={() => setRulesEditorOpen(true)}
        className="btn btn-ghost no-drag"
        title="Edit Matrix Rules"
      >
        <AdjustmentsHorizontalIcon className="w-5 h-5" />
      </button>
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost no-drag"
        title={`Switch to ${settings?.theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {settings?.theme === 'dark' ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </button>
      
      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="btn btn-ghost no-drag"
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>
    </header>
  )
}


