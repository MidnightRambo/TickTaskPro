import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  XMarkIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
]

export function TagManager() {
  const { setTagManagerOpen, tags, createTag, updateTag, deleteTag, tasks } = useStore()
  
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    await createTag(newTagName.trim(), newTagColor)
    setNewTagName('')
  }

  const handleStartEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await updateTag({ id: editingId, name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  const handleDelete = async (id: string, name: string) => {
    const usageCount = tasks.filter(t => t.tags.includes(name)).length
    const message = usageCount > 0
      ? `Delete tag "#${name}"? It's used in ${usageCount} task(s).`
      : `Delete tag "#${name}"?`
    
    if (confirm(message)) {
      await deleteTag(id)
    }
  }

  const getTagUsageCount = (tagName: string) => {
    return tasks.filter(t => t.tags.includes(tagName)).length
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && setTagManagerOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TagIcon className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-semibold">Manage Tags</h2>
          </div>
          <button
            onClick={() => setTagManagerOpen(false)}
            className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Create Tag */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            {/* Color Picker */}
            <div className="relative">
              <button
                className="w-10 h-10 rounded-lg border-2 border-white/20"
                style={{ backgroundColor: newTagColor }}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New tag name..."
              className="flex-1"
            />
            
            <button
              onClick={handleCreate}
              disabled={!newTagName.trim()}
              className="btn btn-primary"
            >
              <PlusIcon className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Color Presets */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className={`
                  w-6 h-6 rounded-full transition-transform hover:scale-110
                  ${newTagColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900' : ''}
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Tags List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {tags.length === 0 ? (
            <div className="p-8 text-center text-surface-500">
              <TagIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tags yet</p>
              <p className="text-sm">Create your first tag above</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence>
                {tags.map(tag => {
                  const isEditing = editingId === tag.id
                  const usageCount = getTagUsageCount(tag.name)

                  return (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-3 hover:bg-white/5"
                    >
                      {isEditing ? (
                        <>
                          <div className="relative">
                            <button
                              className="w-8 h-8 rounded-lg border-2 border-white/20"
                              style={{ backgroundColor: editColor }}
                            />
                            <input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="flex-1 text-sm py-1"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 rounded text-green-500 hover:bg-white/10"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded text-surface-500 hover:bg-white/10"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: tag.color + '20' }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <span
                              className="tag"
                              style={{ 
                                backgroundColor: tag.color + '20',
                                color: tag.color
                              }}
                            >
                              #{tag.name}
                            </span>
                          </div>
                          <span className="text-xs text-surface-500">
                            {usageCount} task{usageCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => handleStartEdit(tag)}
                            className="p-1.5 rounded text-surface-500 hover:text-white hover:bg-white/10"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="p-1.5 rounded text-surface-500 hover:text-red-500 hover:bg-white/10"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setTagManagerOpen(false)}
            className="btn btn-secondary w-full"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


