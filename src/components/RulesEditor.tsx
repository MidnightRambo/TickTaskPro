import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { EisenhowerRule, RuleCondition, Quadrant, ConditionType, ConditionOperator } from '../types'
import { v4 as uuidv4 } from 'uuid'
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

const QUADRANT_CONFIG: Record<Quadrant, { label: string; color: string }> = {
  do: { label: 'Do First', color: 'bg-red-500' },
  schedule: { label: 'Schedule', color: 'bg-blue-500' },
  delegate: { label: 'Delegate', color: 'bg-amber-500' },
  eliminate: { label: 'Eliminate', color: 'bg-gray-500' },
}

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'tag', label: 'Tag' },
  { value: 'list', label: 'List' },
]

const OPERATORS_BY_TYPE: Record<ConditionType, { value: ConditionOperator; label: string }[]> = {
  priority: [
    { value: 'equals', label: 'is' },
    { value: 'notEquals', label: 'is not' },
    { value: 'in', label: 'is one of' },
  ],
  dueDate: [
    { value: 'within', label: 'within X days' },
    { value: 'after', label: 'after X days' },
    { value: 'overdue', label: 'is overdue' },
    { value: 'noDueDate', label: 'has no due date' },
  ],
  tag: [
    { value: 'contains', label: 'includes' },
    { value: 'notContains', label: 'does not include' },
  ],
  list: [
    { value: 'equals', label: 'is' },
    { value: 'notEquals', label: 'is not' },
  ],
  status: [
    { value: 'equals', label: 'is' },
  ],
}

export function RulesEditor() {
  const { setRulesEditorOpen, rules: savedRules, updateRules, tags, lists, getTasksByQuadrant } = useStore()
  const [rules, setRules] = useState<EisenhowerRule[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setRules(savedRules)
  }, [savedRules])

  const handleSave = async () => {
    await updateRules(rules)
    setRulesEditorOpen(false)
  }

  const updateRule = (quadrant: Quadrant, updates: Partial<EisenhowerRule>) => {
    setRules(rules.map(r => 
      r.quadrant === quadrant ? { ...r, ...updates } : r
    ))
  }

  const addCondition = (quadrant: Quadrant) => {
    const rule = rules.find(r => r.quadrant === quadrant)
    if (rule) {
      const newCondition: RuleCondition = {
        type: 'priority',
        operator: 'equals',
        value: 'high',
      }
      updateRule(quadrant, {
        conditions: [...rule.conditions, newCondition],
      })
    }
  }

  const updateCondition = (quadrant: Quadrant, index: number, updates: Partial<RuleCondition>) => {
    const rule = rules.find(r => r.quadrant === quadrant)
    if (rule) {
      const newConditions = [...rule.conditions]
      newConditions[index] = { ...newConditions[index], ...updates }
      updateRule(quadrant, { conditions: newConditions })
    }
  }

  const removeCondition = (quadrant: Quadrant, index: number) => {
    const rule = rules.find(r => r.quadrant === quadrant)
    if (rule) {
      updateRule(quadrant, {
        conditions: rule.conditions.filter((_, i) => i !== index),
      })
    }
  }

  // Get preview counts
  const previewCounts = getTasksByQuadrant()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && setRulesEditorOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[85vh] bg-surface-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-brand-500" />
            <div>
              <h2 className="text-lg font-semibold">Eisenhower Matrix Rules</h2>
              <p className="text-xs text-surface-500">
                Define how tasks are automatically sorted into quadrants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`btn btn-secondary ${showPreview ? 'bg-brand-500/20 text-brand-400' : ''}`}
            >
              <EyeIcon className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setRulesEditorOpen(false)}
              className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {(['do', 'schedule', 'delegate', 'eliminate'] as Quadrant[]).map(quadrant => {
              const rule = rules.find(r => r.quadrant === quadrant)
              if (!rule) return null

              const config = QUADRANT_CONFIG[quadrant]

              return (
                <div
                  key={quadrant}
                  className="border border-white/10 rounded-xl overflow-hidden"
                >
                  {/* Quadrant Header */}
                  <div className={`px-4 py-3 ${config.color} bg-opacity-20`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${config.color}`} />
                        <span className="font-semibold">{config.label}</span>
                      </div>
                      {showPreview && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {previewCounts[quadrant].length} tasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rule Editor */}
                  <div className="p-4 space-y-3">
                    {/* Logic Toggle */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-surface-500">Match</span>
                      <select
                        value={rule.logic}
                        onChange={(e) => updateRule(quadrant, { logic: e.target.value as 'AND' | 'OR' })}
                        className="bg-white/5 border-white/10 rounded py-1 px-2 text-sm"
                      >
                        <option value="AND">ALL conditions</option>
                        <option value="OR">ANY condition</option>
                      </select>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                      <AnimatePresence>
                        {rule.conditions.map((condition, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2"
                          >
                            <ConditionEditor
                              condition={condition}
                              onChange={(updates) => updateCondition(quadrant, index, updates)}
                              tags={tags}
                              lists={lists}
                            />
                            <button
                              onClick={() => removeCondition(quadrant, index)}
                              className="p-1.5 rounded text-surface-500 hover:text-red-500 hover:bg-white/10"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Add Condition */}
                    <button
                      onClick={() => addCondition(quadrant)}
                      className="w-full py-2 border border-dashed border-white/20 rounded-lg text-sm text-surface-500 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Condition
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-brand-500/5 rounded-xl border border-brand-500/20">
            <h4 className="font-medium text-brand-400 mb-2">How Rules Work</h4>
            <ul className="text-sm text-surface-400 space-y-1">
              <li>• Rules are evaluated in order: Do First → Schedule → Delegate → Eliminate</li>
              <li>• A task goes to the first quadrant whose rules it matches</li>
              <li>• Tasks with no matching rules go to "Eliminate"</li>
              <li>• Drag tasks between quadrants to override rules (manual placement)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
          <button
            onClick={() => setRulesEditorOpen(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            <CheckIcon className="w-4 h-4" />
            Save Rules
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Condition Editor Component
function ConditionEditor({
  condition,
  onChange,
  tags,
  lists,
}: {
  condition: RuleCondition
  onChange: (updates: Partial<RuleCondition>) => void
  tags: { id: string; name: string; color: string }[]
  lists: { id: string; name: string }[]
}) {
  const operators = OPERATORS_BY_TYPE[condition.type] || []

  const handleTypeChange = (type: ConditionType) => {
    const newOperators = OPERATORS_BY_TYPE[type]
    onChange({
      type,
      operator: newOperators[0]?.value || 'equals',
      value: type === 'priority' ? 'high' : type === 'dueDate' ? '2' : '',
    })
  }

  return (
    <div className="flex-1 flex items-center gap-2 text-sm">
      {/* Type Selector */}
      <select
        value={condition.type}
        onChange={(e) => handleTypeChange(e.target.value as ConditionType)}
        className="bg-white/5 border-white/10 rounded py-1.5 px-2"
      >
        {CONDITION_TYPES.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Operator Selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value as ConditionOperator })}
        className="bg-white/5 border-white/10 rounded py-1.5 px-2"
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value Input - varies by type and operator */}
      {!['overdue', 'noDueDate'].includes(condition.operator) && (
        <>
          {condition.type === 'priority' && (
            <select
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value })}
              className="bg-white/5 border-white/10 rounded py-1.5 px-2"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          )}

          {condition.type === 'dueDate' && ['within', 'after', 'before'].includes(condition.operator) && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={condition.value}
                onChange={(e) => onChange({ value: e.target.value })}
                className="w-16 bg-white/5 border-white/10 rounded py-1.5 px-2"
                min={0}
              />
              <span className="text-surface-500">days</span>
            </div>
          )}

          {condition.type === 'tag' && (
            <select
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value })}
              className="bg-white/5 border-white/10 rounded py-1.5 px-2"
            >
              <option value="">Select tag...</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.name}>
                  #{tag.name}
                </option>
              ))}
            </select>
          )}

          {condition.type === 'list' && (
            <select
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value })}
              className="bg-white/5 border-white/10 rounded py-1.5 px-2"
            >
              <option value="">Select list...</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  )
}


