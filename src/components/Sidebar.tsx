import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { List } from '../types'
import {
  InboxIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  TagIcon,
  FolderIcon,
  PlusIcon,
  ChevronLeftIcon,
  HomeIcon,
  BriefcaseIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { startOfWeek, endOfWeek } from '../utils/date'

// Color palette for lists - matches existing system
const LIST_COLORS = [
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
]

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  inbox: InboxIcon,
  home: HomeIcon,
  briefcase: BriefcaseIcon,
  folder: FolderIcon,
  list: FolderIcon,
}

export function Sidebar() {
  const {
    lists,
    tasks,
    filter,
    setFilter,
    sidebarCollapsed,
    toggleSidebar,
    createList,
    updateList,
    deleteList,
    setTagManagerOpen,
  } = useStore()

  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#6b7280')
  
  // Get the list being edited
  const editingList = editingListId ? lists.find(l => l.id === editingListId) : null
  
  // Sync edit form with selected list
  useEffect(() => {
    if (editingList) {
      setEditName(editingList.name)
      setEditColor(editingList.color)
    }
  }, [editingList])
  
  const handleEditList = async () => {
    if (!editingListId || !editName.trim()) return
    
    const list = lists.find(l => l.id === editingListId)
    if (!list) return
    
    await updateList({
      ...list,
      name: editName.trim(),
      color: editColor,
    })
    
    setEditingListId(null)
  }
  
  const handleCancelEdit = () => {
    setEditingListId(null)
    setEditName('')
    setEditColor('#6b7280')
  }

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList(newListName.trim())
      setNewListName('')
      setIsCreatingList(false)
    }
  }

  const handleDeleteList = async (id: string) => {
    if (confirm('Delete this list? Tasks will be moved to Inbox.')) {
      await deleteList(id)
    }
  }

  // Smart filters with counts
  const now = new Date()
  const weekStart = startOfWeek(now, 1) // Monday
  const weekEnd = endOfWeek(now, 1) // Sunday
  
  const smartFilters = [
    {
      id: 'all',
      label: 'All Tasks',
      icon: FolderIcon,
      count: tasks.filter(t => !t.completed).length,
      filter: { completed: false },
    },
    {
      id: 'today',
      label: 'Today',
      icon: CalendarIcon,
      count: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false
        return new Date(t.dueDate).toDateString() === now.toDateString()
      }).length,
      filter: { dueDate: 'today' as const, completed: false },
    },
    {
      id: 'thisWeek',
      label: 'This Week',
      icon: CalendarDaysIcon,
      count: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        return dueDate >= weekStart && dueDate <= weekEnd
      }).length,
      filter: { dueDate: 'thisWeek' as const, completed: false },
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: ClockIcon,
      count: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false
        return new Date(t.dueDate) > now
      }).length,
      filter: { dueDate: 'upcoming' as const, completed: false },
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircleIcon,
      count: tasks.filter(t => t.completed).length,
      filter: { completed: true },
    },
  ]

  return (
    <motion.aside
      className="h-full bg-surface-900/50 border-r border-white/5 flex flex-col"
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ duration: 0.2 }}
    >
      {/* Collapse Toggle */}
      <div className="p-3 flex justify-end">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Smart Filters */}
      <nav className="px-3 space-y-1">
        {smartFilters.map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.filter)}
            className={`sidebar-item w-full ${
              JSON.stringify(filter) === JSON.stringify(item.filter) ? 'active' : ''
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 text-left truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!sidebarCollapsed && item.count > 0 && (
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-3 border-t border-white/5" />

      {/* Lists */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between mb-2">
          {!sidebarCollapsed && (
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Lists
            </span>
          )}
          <button
            onClick={() => setIsCreatingList(true)}
            className="p-1 rounded text-surface-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {lists.map(list => {
            const IconComponent = ICONS[list.icon] || FolderIcon
            const taskCount = tasks.filter(t => t.listId === list.id && !t.completed).length
            
            return (
              <div
                key={list.id}
                className="group relative"
              >
                <button
                  onClick={() => setFilter({ listId: list.id, completed: false })}
                  className={`sidebar-item w-full ${
                    filter.listId === list.id ? 'active' : ''
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: list.color + '20' }}
                  >
                    <IconComponent 
                      className="w-3.5 h-3.5" 
                      style={{ color: list.color }}
                    />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{list.name}</span>
                      {taskCount > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                          {taskCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
                
                {/* List actions on hover */}
                {!sidebarCollapsed && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingListId(list.id)
                      }}
                      className="p-1 rounded text-surface-500 hover:text-white hover:bg-white/10"
                      title="Edit list"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(list.id)
                      }}
                      className="p-1 rounded text-surface-500 hover:text-red-500 hover:bg-white/10"
                      title="Delete list"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* New List Input */}
          <AnimatePresence>
            {isCreatingList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateList()
                    if (e.key === 'Escape') setIsCreatingList(false)
                  }}
                  onBlur={() => {
                    if (!newListName.trim()) setIsCreatingList(false)
                  }}
                  placeholder="List name..."
                  className="w-full text-sm py-1.5"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags Button */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setTagManagerOpen(true)}
          className="sidebar-item w-full"
        >
          <TagIcon className="w-5 h-5" />
          {!sidebarCollapsed && <span>Manage Tags</span>}
        </button>
      </div>
      
      {/* Edit List Modal */}
      <AnimatePresence>
        {editingListId && editingList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && handleCancelEdit()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: editColor + '20' }}
                  >
                    <FolderIcon className="w-4 h-4" style={{ color: editColor }} />
                  </div>
                  <h2 className="text-lg font-semibold">Edit List</h2>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/10"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Name input */}
                <div>
                  <label className="text-sm font-medium text-surface-400 mb-2 block">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditList()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="w-full"
                    placeholder="Enter list name..."
                    autoFocus
                  />
                </div>
                
                {/* Color picker */}
                <div>
                  <label className="text-sm font-medium text-surface-400 mb-2 block">
                    Color
                  </label>
                  <div className="grid grid-cols-9 gap-2">
                    {LIST_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditColor(color.value)}
                        className={`
                          w-8 h-8 rounded-lg transition-all
                          ${editColor === color.value 
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' 
                            : 'hover:scale-110'
                          }
                        `}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditList}
                  disabled={!editName.trim()}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}


