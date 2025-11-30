import { motion } from 'framer-motion'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface ListViewProps {
  tasks: Task[]
}

export function ListView({ tasks }: ListViewProps) {
  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Active Tasks */}
        <section>
          <h2 className="text-sm font-semibold text-surface-400 mb-3">
            Active ({incompleteTasks.length})
          </h2>
          <div className="space-y-2">
            {incompleteTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
            {incompleteTasks.length === 0 && (
              <p className="text-center text-surface-500 py-8">
                No active tasks. Create one with ⌘N
              </p>
            )}
          </div>
        </section>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-surface-400 mb-3">
              Completed ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.slice(0, 10).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
              {completedTasks.length > 10 && (
                <p className="text-center text-surface-500 text-sm py-2">
                  +{completedTasks.length - 10} more completed tasks
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}


