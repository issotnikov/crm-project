import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

interface ReminderTask {
  id: string
  title: string
  due_date: string
  priority: string
  type: string
  customer_name: string | null
  reminder_type: 'overdue' | 'soon'
}

const TYPE_ICONS: Record<string, string> = {
  call: '📞', meeting: '🤝', email: '✉️', document: '📄', custom: '📌',
}

function timeUntil(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  if (diff < 0) {
    const abs = Math.abs(diff)
    if (abs < 3600) return `просрочено на ${Math.floor(abs / 60)} мин`
    if (abs < 86400) return `просрочено на ${Math.floor(abs / 3600)} ч`
    return `просрочено на ${Math.floor(abs / 86400)} дн`
  }
  if (diff < 3600) return `через ${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `через ${Math.floor(diff / 3600)} ч`
  return `через ${Math.floor(diff / 86400)} дн`
}

export function ReminderToasts() {
  const [reminders, setReminders] = useState<ReminderTask[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadReminders = useCallback(async () => {
    try {
      const data = await api.getReminders()
      setReminders(data.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadReminders()
    // Check every 60 seconds
    const interval = setInterval(loadReminders, 60000)
    return () => clearInterval(interval)
  }, [loadReminders])

  const visible = reminders.filter((r) => !dismissed.has(r.id))
  // Show max 3 at a time
  const shown = visible.slice(0, 3)

  if (shown.length === 0) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm">
      {shown.map((task) => {
        const isOverdue = task.reminder_type === 'overdue'
        return (
          <div
            key={task.id}
            className={`rounded-xl border shadow-2xl transition-all duration-300 cursor-pointer ${
              isOverdue
                ? 'bg-red-950/90 border-red-500/50'
                : 'bg-[#1A1147]/95 border-indigo-500/40'
            } backdrop-blur-md`}
            onClick={() => setExpanded(expanded === task.id ? null : task.id)}
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                isOverdue ? 'bg-red-500/20' : 'bg-indigo-500/20'
              }`}>
                {isOverdue ? '⚠️' : TYPE_ICONS[task.type] || '⏰'}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                  {task.title}
                </div>
                <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                  ⏰ {timeUntil(task.due_date)}
                </div>
                {task.customer_name && (
                  <div className="text-xs text-gray-500 mt-0.5">👤 {task.customer_name}</div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(task.id) }}
                className="text-gray-500 hover:text-white text-lg leading-none w-6 h-6 flex items-center justify-center rounded flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Expanded actions */}
            {expanded === task.id && (
              <div className="px-3.5 pb-3.5 pt-1 flex gap-2 border-t border-white/5 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    api.updateTask(task.id, { status: 'done' }).catch(() => {})
                    dismiss(task.id)
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  ✓ Выполнить
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(task.id) }}
                  className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Отложить
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Counter */}
      {visible.length > 3 && (
        <div className="text-center text-xs text-gray-500">
          и ещё {visible.length - 3} напоминаний...
        </div>
      )}
    </div>
  )
}
