import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { List } from '../types'
import {
  InboxIcon,
  CalendarIcon,
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
} from '@heroicons/react/24/outline'

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
    deleteList,
    setTagManagerOpen,
  } = useStore()

  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)

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
        return new Date(t.dueDate).toDateString() === new Date().toDateString()
      }).length,
      filter: { dueDate: 'today' as const, completed: false },
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: ClockIcon,
      count: tasks.filter(t => {
        if (t.completed || !t.dueDate) return false
        return new Date(t.dueDate) > new Date()
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
                      onClick={() => setEditingListId(list.id)}
                      className="p-1 rounded text-surface-500 hover:text-white hover:bg-white/10"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="p-1 rounded text-surface-500 hover:text-red-500 hover:bg-white/10"
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
    </motion.aside>
  )
}


