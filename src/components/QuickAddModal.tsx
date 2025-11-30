import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import * as chrono from 'chrono-node'
import {
  XMarkIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

export function QuickAddModal() {
  const { setQuickAddOpen, createTask, lists, tags, settings } = useStore()
  const [input, setInput] = useState('')
  const [selectedList, setSelectedList] = useState<string | undefined>()
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Parse input for preview
  const parsedDate = chrono.parse(input)[0]
  const parsedTags = input.match(/#(\w+)/g)?.map(t => t.slice(1)) || []

  // Filter tag suggestions
  const tagSuggestions = tags.filter(t => 
    t.name.toLowerCase().includes(tagQuery.toLowerCase()) &&
    !parsedTags.includes(t.name)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    await createTask(input, {
      listId: selectedList,
    })

    setInput('')
    setQuickAddOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuickAddOpen(false)
    }
  }

  const insertTag = (tagName: string) => {
    const cursorPos = inputRef.current?.selectionStart || input.length
    const beforeCursor = input.slice(0, cursorPos)
    const afterCursor = input.slice(cursorPos)
    
    // Find where the current tag input starts
    const lastHashIndex = beforeCursor.lastIndexOf('#')
    if (lastHashIndex !== -1) {
      const newInput = beforeCursor.slice(0, lastHashIndex) + `#${tagName} ` + afterCursor
      setInput(newInput)
    } else {
      setInput(input + ` #${tagName} `)
    }
    
    setShowTagSuggestions(false)
    setTagQuery('')
    inputRef.current?.focus()
  }

  // Check for tag input
  useEffect(() => {
    const cursorPos = inputRef.current?.selectionStart || input.length
    const beforeCursor = input.slice(0, cursorPos)
    const match = beforeCursor.match(/#(\w*)$/)
    
    if (match) {
      setTagQuery(match[1])
      setShowTagSuggestions(true)
    } else {
      setShowTagSuggestions(false)
      setTagQuery('')
    }
  }, [input])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay flex items-start justify-center pt-[15vh]"
      onClick={(e) => e.target === e.currentTarget && setQuickAddOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-xl bg-surface-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          {/* Input Area */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-brand-500" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a task... (e.g., 'Review proposal tomorrow at 2pm #work')"
                className="flex-1 bg-transparent border-none text-lg focus:ring-0 placeholder-surface-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tag Suggestions Dropdown */}
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="mt-2 p-2 bg-surface-800 rounded-lg border border-white/10">
                <p className="text-xs text-surface-500 mb-2">Tag suggestions</p>
                <div className="flex flex-wrap gap-1">
                  {tagSuggestions.slice(0, 5).map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => insertTag(tag.name)}
                      className="tag"
                      style={{ 
                        backgroundColor: tag.color + '20',
                        color: tag.color
                      }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Preview */}
          {(parsedDate || parsedTags.length > 0) && (
            <div className="px-4 pb-3 flex items-center gap-4 text-sm text-surface-400">
              {parsedDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-brand-500" />
                  <span>{parsedDate.date().toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
              {parsedTags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4 text-brand-500" />
                  <span>{parsedTags.map(t => `#${t}`).join(' ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-surface-900/50">
            {/* List Selector */}
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-surface-500" />
              <select
                value={selectedList || ''}
                onChange={(e) => setSelectedList(e.target.value || undefined)}
                className="bg-transparent border-none text-sm py-0 focus:ring-0"
              >
                <option value="">Inbox</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hints */}
            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd>
                to save
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd>
                to cancel
              </span>
            </div>
          </div>
        </form>

        {/* Tips */}
        <div className="px-4 py-3 bg-brand-500/5 border-t border-brand-500/20">
          <p className="text-xs text-brand-400">
            <strong>💡 Tips:</strong> Use natural language for dates ("tomorrow 3pm", "next Friday") 
            and #tags inline. Default settings will be applied automatically.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}


