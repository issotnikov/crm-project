import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface TaskComment {
  id: string; author: string; body: string; created_at: string
}
interface ChecklistItem {
  id: string; text: string; done: boolean
}
interface Task {
  id: string; title: string; description: string; status: string; priority: string
  type: string; assignee_name: string; created_by_name: string
  due_date: string | null; remind_at: string | null; completed_at: string | null
  customer_name: string | null; deal_name: string | null; lead_name: string | null
  checklist: ChecklistItem[]; comments: TaskComment[]; created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  call: '📞', meeting: '🤝', email: '✉️', document: '📄', follow_up: '🔄', custom: '📌',
}
const TYPE_LABELS: Record<string, string> = {
  call: 'Звонок', meeting: 'Встреча', email: 'Письмо', document: 'Документ', follow_up: 'Follow-up', custom: 'Другое',
}
const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  urgent: { dot: 'bg-red-500', label: 'Срочный' },
  high: { dot: 'bg-amber-500', label: 'Высокий' },
  medium: { dot: 'bg-blue-500', label: 'Средний' },
  low: { dot: 'bg-gray-500', label: 'Низкий' },
}
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает', color: 'text-gray-400' },
  in_progress: { label: 'В работе', color: 'text-amber-400' },
  review: { label: 'На проверке', color: 'text-purple-400' },
  done: { label: 'Готово', color: 'text-emerald-400' },
  cancelled: { label: 'Отменено', color: 'text-red-400' },
}

function formatDueDate(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: 'без срока', overdue: false }
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const dt = new Date(iso)
  if (diff < 0) {
    const abs = Math.abs(diff)
    if (abs < 3600) return { text: `просрочено на ${Math.floor(abs / 60)} мин`, overdue: true }
    if (abs < 86400) return { text: `просрочено на ${Math.floor(abs / 3600)} ч`, overdue: true }
    return { text: `просрочено на ${Math.floor(abs / 86400)} дн`, overdue: true }
  }
  if (diff < 3600) return { text: `через ${Math.floor(diff / 60)} мин`, overdue: false }
  if (diff < 86400) return { text: `через ${Math.floor(diff / 3600)} ч`, overdue: false }
  if (diff < 86400 * 7) return { text: `через ${Math.floor(diff / 86400)} дн`, overdue: false }
  return { text: dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), overdue: false }
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'today' | 'all' | 'overdue' | 'done' | 'no_date'>('today')
  const [selected, setSelected] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    setLoading(true)
    try { const d = await api.getTasks(); setTasks(d.data || []) }
    catch { setTasks([]) }
    finally { setLoading(false) }
  }

  const openTask = async (t: Task) => {
    setSelected(t)
    try { const d = await api.getTaskDetail(t.id); setSelected(d) } catch {}
  }

  const toggleDone = async (t: Task) => {
    const newStatus = t.status === 'done' ? 'pending' : 'done'
    try { await api.updateTask(t.id, { status: newStatus }) } catch {}
    loadTasks()
  }

  // Group tasks
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())
  const today = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    const d = new Date(t.due_date); const now = new Date()
    return d > now && d.toDateString() === now.toDateString()
  })
  const upcoming = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    const d = new Date(t.due_date); const now = new Date()
    return d > now && d.toDateString() !== now.toDateString()
  })
  const noDate = tasks.filter((t) => t.status !== 'done' && !t.due_date)
  const done = tasks.filter((t) => t.status === 'done')

  let displayed: Task[]
  if (filter === 'today') displayed = [...overdue, ...today]
  else if (filter === 'overdue') displayed = overdue
  else if (filter === 'done') displayed = done
  else if (filter === 'no_date') displayed = noDate
  else displayed = tasks

  // Group displayed tasks
  const groups = [
    { label: 'Просрочено', icon: '🔥', tasks: displayed.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()) },
    { label: 'Сегодня', icon: '📌', tasks: displayed.filter((t) => { if (!t.due_date || t.status === 'done') return false; const d = new Date(t.due_date); const now = new Date(); return d > now && d.toDateString() === now.toDateString() }) },
    { label: 'Предстоящие', icon: '📅', tasks: displayed.filter((t) => { if (!t.due_date || t.status === 'done') return false; const d = new Date(t.due_date); const now = new Date(); return d > now && d.toDateString() !== now.toDateString() }) },
    { label: 'Без даты', icon: '⚪', tasks: displayed.filter((t) => t.status !== 'done' && !t.due_date) },
    { label: 'Выполнено', icon: '✅', tasks: displayed.filter((t) => t.status === 'done') },
  ].filter((g) => g.tasks.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-gray-400 text-sm mt-1">
            Активных: {overdue.length + today.length + upcoming.length + noDate.length} · Просрочено: <span className={overdue.length > 0 ? 'text-red-400' : ''}>{overdue.length}</span>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Новая задача
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'today', label: 'Сегодня', count: overdue.length + today.length },
          { key: 'all', label: 'Все', count: tasks.length },
          { key: 'overdue', label: '🔥 Просрочено', count: overdue.length },
          { key: 'no_date', label: 'Без даты', count: noDate.length },
          { key: 'done', label: '✅ Выполнено', count: done.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === tab.key ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white'}`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${filter === tab.key ? 'bg-white/20' : 'bg-[#2D2A6E]'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Task groups */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Нет задач в этой категории</div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span>{group.icon}</span> {group.label}
                <span className="text-xs bg-[#2D2A6E] px-2 py-0.5 rounded-full">{group.tasks.length}</span>
              </h2>
              <div className="space-y-1.5">
                {group.tasks.map((t) => {
                  const pr = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
                  const due = formatDueDate(t.due_date)
                  const isDone = t.status === 'done'
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-[#252161] border ${due.overdue && !isDone ? 'bg-red-500/5 border-red-500/20' : 'bg-[#1E1B4B] border-[#312E81]'}`}
                      onClick={() => openTask(t)}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDone(t) }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-[#4338CA] hover:border-indigo-500'}`}
                      >
                        {isDone && <span className="text-white text-xs">✓</span>}
                      </button>
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-[#2D2A6E] flex items-center justify-center text-sm flex-shrink-0">
                        {TYPE_ICONS[t.type] || '📌'}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${isDone ? 'line-through text-gray-500' : ''}`}>{t.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs ${due.overdue && !isDone ? 'text-red-400 font-medium' : 'text-gray-500'}`}>⏰ {due.text}</span>
                          {t.customer_name && <span className="text-xs text-gray-500">👤 {t.customer_name}</span>}
                          {t.deal_name && <span className="text-xs text-gray-500">🎯 {t.deal_name}</span>}
                          {t.checklist.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ☑ {t.checklist.filter(c => c.done).length}/{t.checklist.length}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Priority */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
                        <span className="text-xs text-gray-500 hidden sm:inline">{pr.label}</span>
                      </div>
                      {/* Assignee */}
                      {t.assignee_name && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                          {t.assignee_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} subtitle={selected ? TYPE_LABELS[selected.type] || selected.type : ''} wide>
        {selected ? <TaskDetail task={selected} onUpdate={loadTasks} onClose={() => setSelected(null)} /> : null}
      </Drawer>

      {/* Create modal */}
      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadTasks} />
    </div>
  )
}

function TaskDetail({ task: t, onUpdate, onClose }: { task: Task; onUpdate: () => void; onClose: () => void }) {
  const [checklist, setChecklist] = useState(t.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState(t.comments || [])

  const pr = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
  const due = formatDueDate(t.due_date)
  const isDone = t.status === 'done'

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    setChecklist(prev => [...prev, { id: `cl_${Date.now()}`, text: newChecklistItem, done: false }])
    setNewChecklistItem('')
  }

  const addComment = () => {
    if (!newComment.trim()) return
    const user = JSON.parse(localStorage.getItem('crm_user') || '{"name":"Вы"}')
    setComments(prev => [...prev, { id: `cm_${Date.now()}`, author: user.name, body: newComment, created_at: new Date().toISOString() }])
    setNewComment('')
  }

  const checklistDone = checklist.filter(c => c.done).length
  const checklistTotal = checklist.length

  return (
    <div className="space-y-5">
      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge status={isDone ? 'converted' : 'new'}>{isDone ? '✅ Выполнено' : '⏳ Ожидает'}</Badge>
        <Badge>{pr.dot && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${pr.dot}`} />}{pr.label}</Badge>
        <Badge>{TYPE_ICONS[t.type]} {TYPE_LABELS[t.type] || t.type}</Badge>
        <span className={`text-xs ${due.overdue && !isDone ? 'text-red-400 font-medium' : 'text-gray-500'}`}>⏰ {due.text}</span>
      </div>

      {/* Description */}
      {t.description && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Описание</div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{t.description}</p>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {t.customer_name && <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3"><div className="text-xs text-gray-500">Клиент</div><div className="text-gray-300">{t.customer_name}</div></div>}
        {t.deal_name && <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3"><div className="text-xs text-gray-500">Сделка</div><div className="text-gray-300">{t.deal_name}</div></div>}
        {t.assignee_name && <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3"><div className="text-xs text-gray-500">Исполнитель</div><div className="text-gray-300">{t.assignee_name}</div></div>}
        {t.due_date && <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3"><div className="text-xs text-gray-500">Срок</div><div className="text-gray-300">{new Date(t.due_date).toLocaleString('ru-RU')}</div></div>}
      </div>

      {/* Checklist */}
      {checklistTotal > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-500 uppercase">Чек-лист</div>
            <div className="text-xs text-gray-400">{checklistDone} из {checklistTotal}</div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-[#2D2A6E] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%` }} />
          </div>
          <div className="space-y-1.5">
            {checklist.map((c) => (
              <button key={c.id} onClick={() => toggleChecklistItem(c.id)} className="w-full flex items-center gap-2 text-sm text-left">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${c.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#4338CA]'}`}>
                  {c.done && <span className="text-white text-xs">✓</span>}
                </span>
                <span className={c.done ? 'line-through text-gray-500' : 'text-gray-300'}>{c.text}</span>
              </button>
            ))}
          </div>
          {/* Add item */}
          <div className="flex gap-2 mt-3">
            <input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              className={`${inputClass} text-sm`}
              placeholder="+ добавить пункт..."
            />
            <button onClick={addChecklistItem} className="bg-[#4338CA] hover:bg-indigo-600 text-white px-3 rounded-lg text-sm transition-colors">+</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!isDone ? (
          <button
            onClick={() => { api.updateTask(t.id, { status: 'done' }).catch(() => {}); onUpdate(); onClose() }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ✓ Выполнить
          </button>
        ) : (
          <button
            onClick={() => { api.updateTask(t.id, { status: 'pending' }).catch(() => {}); onUpdate(); onClose() }}
            className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ↩ Вернуть в работу
          </button>
        )}
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">📅 Перенести</button>
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">👤 Делегировать</button>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-3">Комментарии ({comments.length})</div>
          <div className="space-y-2">
            {comments.map((cm) => (
              <div key={cm.id} className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                    {cm.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium">{cm.author}</span>
                  <span className="text-xs text-gray-500 ml-auto">{new Date(cm.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-400 ml-8">{cm.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New comment */}
      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addComment()}
          className={inputClass}
          placeholder="Добавить комментарий..."
        />
        <button onClick={addComment} className="bg-[#4338CA] hover:bg-indigo-600 text-white px-4 rounded-lg text-sm transition-colors">→</button>
      </div>
    </div>
  )
}

function CreateTaskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'call', priority: 'medium',
    dueDate: '', dueTime: '12:00', customer: '', deal: '',
  })

  const handleSave = async () => {
    const due_date = form.dueDate ? `${form.dueDate}T${form.dueTime}:00` : null
    try {
      await api.createTask({
        title: form.title,
        description: form.description,
        type: form.type,
        priority: form.priority,
        due_date,
        customer_name: form.customer || null,
        deal_name: form.deal || null,
      })
    } catch { /* mock ok */ }
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая задача">
      <div className="space-y-4">
        <FormField label="Название задачи">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Например: Позвонить клиенту" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Тип">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
              <option value="call">📞 Звонок</option>
              <option value="meeting">🤝 Встреча</option>
              <option value="email">✉️ Письмо</option>
              <option value="document">📄 Документ</option>
              <option value="follow_up">🔄 Follow-up</option>
              <option value="custom">📌 Другое</option>
            </select>
          </FormField>
          <FormField label="Приоритет">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Дата">
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Время">
            <input type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className={inputClass} />
          </FormField>
        </div>
        <FormField label="Клиент (опционально)">
          <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={inputClass} placeholder="ООО «Ромашка»" />
        </FormField>
        <FormField label="Описание">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[70px] resize-y`} placeholder="Что нужно сделать?" />
        </FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
