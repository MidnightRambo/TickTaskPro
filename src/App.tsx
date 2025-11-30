import { useEffect } from 'react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { EisenhowerMatrix } from './components/EisenhowerMatrix'
import { TaskDrawer } from './components/TaskDrawer'
import { QuickAddModal } from './components/QuickAddModal'
import { SettingsModal } from './components/SettingsModal'
import { RulesEditor } from './components/RulesEditor'
import { TagManager } from './components/TagManager'
import { AnimatePresence } from 'framer-motion'

function App() {
  const { 
    loadAll, 
    settings,
    selectedTaskId,
    isQuickAddOpen,
    isSettingsOpen,
    isRulesEditorOpen,
    isTagManagerOpen,
    setQuickAddOpen,
  } = useStore()

  // Load data on mount
  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Apply theme
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark')
      document.documentElement.classList.toggle('light', settings.theme === 'light')
    }
  }, [settings?.theme])

  // Listen for global shortcuts
  useEffect(() => {
    const handleQuickAdd = () => setQuickAddOpen(true)
    window.electronAPI?.on('trigger-quick-add', handleQuickAdd)
    
    return () => {
      window.electronAPI?.removeListener('trigger-quick-add', handleQuickAdd)
    }
  }, [setQuickAddOpen])

  return (
    <div className="h-screen flex flex-col overflow-hidden animated-gradient">
      {/* Topbar */}
      <Topbar />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Area */}
        <main className="flex-1 overflow-hidden p-6">
          <EisenhowerMatrix />
        </main>
        
        {/* Task Detail Drawer */}
        <AnimatePresence mode="wait">
          {selectedTaskId && <TaskDrawer key="task-drawer" />}
        </AnimatePresence>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {isQuickAddOpen && <QuickAddModal />}
        {isSettingsOpen && <SettingsModal />}
        {isRulesEditorOpen && <RulesEditor />}
        {isTagManagerOpen && <TagManager />}
      </AnimatePresence>
    </div>
  )
}

export default App


