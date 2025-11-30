import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useStore } from '../store'
import { TaskCard } from './TaskCard'
import { ListView } from './ListView'
import type { Quadrant } from '../types'

const QUADRANT_CONFIG: Record<Quadrant, {
  label: string
  subtitle: string
  color: string
  bgGradient: string
  borderColor: string
}> = {
  do: {
    label: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'text-red-400',
    bgGradient: 'from-red-500/10 to-red-500/5',
    borderColor: 'border-red-500/30',
  },
  schedule: {
    label: 'Schedule',
    subtitle: 'Important, Not Urgent',
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-500/30',
  },
  delegate: {
    label: 'Delegate',
    subtitle: 'Urgent, Not Important',
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/10 to-amber-500/5',
    borderColor: 'border-amber-500/30',
  },
  eliminate: {
    label: 'Eliminate',
    subtitle: 'Neither Urgent nor Important',
    color: 'text-gray-400',
    bgGradient: 'from-gray-500/10 to-gray-500/5',
    borderColor: 'border-gray-500/30',
  },
}

const QUADRANT_ORDER: Quadrant[] = ['do', 'schedule', 'delegate', 'eliminate']

export function EisenhowerMatrix() {
  const { getTasksByQuadrant, updateTask, viewMode, getFilteredTasks } = useStore()
  const tasksByQuadrant = getTasksByQuadrant()

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return

    const sourceQuadrant = result.source.droppableId as Quadrant
    const destQuadrant = result.destination.droppableId as Quadrant
    const taskId = result.draggableId

    if (sourceQuadrant === destQuadrant) return

    // Find the task and update its manual quadrant
    const allTasks = Object.values(tasksByQuadrant).flat()
    const task = allTasks.find(t => t.id === taskId)
    
    if (task) {
      await updateTask({
        ...task,
        manualQuadrant: destQuadrant,
      })
    }
  }, [tasksByQuadrant, updateTask])

  if (viewMode === 'list') {
    return <ListView tasks={getFilteredTasks()} />
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full quadrant-grid">
        {QUADRANT_ORDER.map((quadrant, index) => {
          const config = QUADRANT_CONFIG[quadrant]
          const tasks = tasksByQuadrant[quadrant]

          return (
            <motion.div
              key={quadrant}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                rounded-2xl border ${config.borderColor}
                bg-gradient-to-br ${config.bgGradient}
                backdrop-blur-sm overflow-hidden flex flex-col
              `}
            >
              {/* Quadrant Header */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${config.color}`}>
                      {config.label}
                    </h3>
                    <p className="text-xs text-surface-500">{config.subtitle}</p>
                  </div>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-surface-400">
                    {tasks.length}
                  </span>
                </div>
              </div>

              {/* Droppable Task List */}
              <Droppable droppableId={quadrant}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      flex-1 p-3 overflow-y-auto space-y-2
                      transition-colors duration-200
                      ${snapshot.isDraggingOver ? 'bg-white/5' : ''}
                    `}
                  >
                    {tasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-surface-600 italic">
                          Drop tasks here
                        </p>
                      </div>
                    ) : (
                      tasks.map((task, taskIndex) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={taskIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard 
                                task={task} 
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </motion.div>
          )
        })}
      </div>
    </DragDropContext>
  )
}


