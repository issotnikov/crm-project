import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface Notification {
  id: string; title: string; due_date: string; priority: string
  type: string; customer_name: string | null; reminder_type: 'overdue' | 'soon'
}

const TYPE_ICONS: Record<string, string> = {
  call: '📞', meeting: '🤝', email: '✉️', document: '📄', custom: '📌',
}
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-l-red-500', high: 'border-l-amber-500', medium: 'border-l-blue-500', low: 'border-l-gray-600',
}

function timeUntil(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  if (diff < 0) {
    const abs = Math.abs(diff)
    if (abs < 3600) return 'просрочено на ' + Math.floor(abs / 60) + ' мин'
    if (abs < 86400) return 'просрочено на ' + Math.floor(abs / 3600) + ' ч'
    return 'просрочено на ' + Math.floor(abs / 86400) + ' дн'
  }
  if (diff < 3600) return 'через ' + Math.floor(diff / 60) + ' мин'
  if (diff < 86400) return 'через ' + Math.floor(diff / 3600) + ' ч'
  return 'через ' + Math.floor(diff / 86400) + ' дн'
}

export function NotificationCenter({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [read, setRead] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    try {
      const data = await api.getReminders()
      setNotifications(data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !read.has(n.id))
  const overdue = notifications.filter(n => n.reminder_type === 'overdue' && !read.has(n.id))
  const soon = notifications.filter(n => n.reminder_type === 'soon' && !read.has(n.id))

  const markAllRead = () => {
    setRead(new Set(notifications.map(n => n.id)))
  }

  const dismiss = (id: string) => {
    setRead(prev => new Set(prev).add(id))
  }

  const completeTask = (id: string) => {
    api.updateTask(id, { status: 'done' }).catch(() => {})
    setRead(prev => new Set(prev).add(id))
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg bg-[#1E1B4B] border border-[#312E81] flex items-center justify-center text-gray-400 hover:text-white transition-colors relative"
      >
        {open ? '🔔' : '🔔'}
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {unread.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-[#1A1147] border border-[#312E81] rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#312E81]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">🔔 Уведомления</h3>
              {unread.length > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{unread.length} новых</span>
              )}
            </div>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                ✓ Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-4xl mb-3 opacity-30">✅</div>
                <div className="text-sm text-gray-400">Нет активных уведомлений</div>
                <div className="text-xs text-gray-600 mt-1">Все задачи под контролем</div>
              </div>
            ) : (
              <>
                {/* Overdue section */}
                {overdue.length > 0 && (
                  <div className="border-b border-[#312E81]">
                    <div className="px-4 py-2 bg-red-500/5">
                      <span className="text-xs font-semibold text-red-400 uppercase">🔥 Просрочено ({overdue.length})</span>
                    </div>
                    {overdue.map(n => (
                      <NotificationItem key={n.id} n={n} onDismiss={dismiss} onComplete={completeTask} onNavigate={onNavigate} />
                    ))}
                  </div>
                )}

                {/* Due soon section */}
                {soon.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-indigo-500/5">
                      <span className="text-xs font-semibold text-indigo-400 uppercase">⏰ Скоро ({soon.length})</span>
                    </div>
                    {soon.map(n => (
                      <NotificationItem key={n.id} n={n} onDismiss={dismiss} onComplete={completeTask} onNavigate={onNavigate} />
                    ))}
                  </div>
                )}

                {/* Read items */}
                {notifications.filter(n => read.has(n.id)).length > 0 && (
                  <div className="border-t border-[#312E81]">
                    <div className="px-4 py-2">
                      <span className="text-xs text-gray-600 uppercase">Прочитанные</span>
                    </div>
                    {notifications.filter(n => read.has(n.id)).map(n => (
                      <NotificationItem key={n.id} n={n} onDismiss={dismiss} onComplete={completeTask} onNavigate={onNavigate} dimmed />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#312E81] p-2">
            <button
              onClick={() => { onNavigate('tasks'); setOpen(false) }}
              className="w-full text-center text-xs text-gray-400 hover:text-white py-1.5 rounded-lg hover:bg-[#1E1B4B] transition-colors"
            >
              Открыть все задачи →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n, onDismiss, onComplete, onNavigate, dimmed }: {
  n: Notification
  onDismiss: (id: string) => void
  onComplete: (id: string) => void
  onNavigate: (page: any) => void
  dimmed?: boolean
}) {
  const isOverdue = n.reminder_type === 'overdue'
  const prColor = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.medium

  return (
    <div className={"flex items-start gap-2.5 px-4 py-2.5 border-b border-[#312E81] last:border-0 border-l-2 " + prColor + " " + (dimmed ? 'opacity-40' : '') + " hover:bg-[#1E1B4B] transition-colors group"}>
      <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 " + (isOverdue ? 'bg-red-500/15' : 'bg-indigo-500/15')}>
        {isOverdue ? '⚠️' : TYPE_ICONS[n.type] || '⏰'}
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onNavigate('tasks'); onDismiss(n.id) }}>
        <div className="text-xs font-medium truncate">{n.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={"text-[11px] " + (isOverdue ? 'text-red-400' : 'text-gray-500')}>{timeUntil(n.due_date)}</span>
          {n.customer_name && <span className="text-[11px] text-gray-600 truncate">· {n.customer_name}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(n.id) }}
          className="w-6 h-6 rounded flex items-center justify-center text-xs text-emerald-400 hover:bg-emerald-500/15 transition-colors"
          title="Выполнить"
        >✓</button>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id) }}
          className="w-6 h-6 rounded flex items-center justify-center text-xs text-gray-500 hover:text-white hover:bg-[#2D2A6E] transition-colors"
          title="Закрыть"
        >×</button>
      </div>
    </div>
  )
}
