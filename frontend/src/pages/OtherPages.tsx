import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

// ── Deals Page (Kanban) ─────────────────────────────────────

interface Deal {
  id: string; title: string; amount: number; customer_name: string
  stage_name: string; stage_id: string; stage_order: number
  status: string; probability: number; assigned_to_name: string
  description: string; expected_close_date: string | null
  tasks: any[]; documents: any[]; customer?: any
}

const STAGES = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'Новый', color: '#3B82F6' },
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'Квалификация', color: '#8B5CF6' },
  { id: 'b1000000-0000-0000-0000-000000000004', name: 'КП отправлено', color: '#F59E0B' },
  { id: 'b1000000-0000-0000-0000-000000000005', name: 'Переговоры', color: '#EC4899' },
  { id: 'b1000000-0000-0000-0000-000000000006', name: 'Договор', color: '#F97316' },
  { id: 'b1000000-0000-0000-0000-000000000008', name: 'Выиграно', color: '#10B981' },
]

function formatAmount(n: number): string {
  if (n >= 1000000) return `₽${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `₽${(n / 1000).toFixed(0)}K`
  return `₽${n}`
}

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Deal | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadDeals() }, [])

  const loadDeals = async () => {
    setLoading(true)
    try {
      const data = await api.getDeals()
      setDeals(data.data || [])
    } catch { setDeals([]) }
    finally { setLoading(false) }
  }

  const openDeal = async (d: Deal) => {
    setSelected(d); setDetailLoading(true)
    try { const detail = await api.getDealDetail(d.id); setSelected(detail) }
    catch { /* use list data */ }
    finally { setDetailLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Сделки</h1>
          <p className="text-gray-400 text-sm mt-1">
            Активных: {deals.filter(d => d.status === 'open').length} · Выиграно: {deals.filter(d => d.status === 'won').length}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Новая сделка
        </button>
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">Загрузка...</div> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id)
            const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0)
            return (
              <div key={stage.id} className="min-w-[260px] w-[260px] bg-[#15102E] rounded-xl flex flex-col">
                <div className="p-3 border-b border-[#312E81] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">{stage.name}</span>
                  </div>
                  <span className="text-xs bg-[#2D2A6E] px-2 py-0.5 rounded-full text-gray-400">{stageDeals.length}</span>
                </div>
                <div className="p-2.5 flex-1 space-y-2 min-h-[100px]">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => openDeal(deal)}
                      className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3 hover:border-indigo-700 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-lg font-bold">{formatAmount(deal.amount)}</span>
                        {deal.status === 'won' && <span className="text-xs text-emerald-400">✅</span>}
                      </div>
                      <div className="text-sm font-medium mb-1">{deal.title}</div>
                      <div className="text-xs text-gray-500 mb-2">{deal.customer_name}</div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#312E81]">
                        <span className="text-xs text-gray-500">{deal.tasks?.length || 0} задач</span>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                          {deal.assigned_to_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && <div className="text-center text-xs text-gray-600 py-4">Пусто</div>}
                </div>
                {totalAmount > 0 && (
                  <div className="p-2.5 border-t border-[#312E81] text-xs text-gray-500 text-center">
                    Сумма: <span className="text-gray-300 font-medium">{formatAmount(totalAmount)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} subtitle={selected ? formatAmount(selected.amount) : ''} wide>
        {detailLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : selected ? <DealDetail deal={selected} /> : null}
      </Drawer>

      <CreateDealModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadDeals} />
    </div>
  )
}

function DealDetail({ deal: d }: { deal: Deal }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge status={d.status}>{d.status === 'won' ? '✅ Выиграна' : d.status === 'lost' ? '❌ Проиграна' : 'Открыта'}</Badge>
        <Badge>{d.stage_name}</Badge>
        <span className="text-xs text-gray-500">Вероятность: {d.probability}%</span>
        {d.assigned_to_name && <span className="text-xs text-gray-500">👤 {d.assigned_to_name}</span>}
        {d.expected_close_date && <span className="text-xs text-gray-500">📅 {d.expected_close_date}</span>}
      </div>

      {d.description && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Описание</div>
          <p className="text-sm text-gray-300">{d.description}</p>
        </div>
      )}

      {/* Customer */}
      {d.customer && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Клиент</div>
          <div className="font-medium text-sm">{d.customer.name}</div>
          {d.customer.contacts?.[0] && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
              {d.customer.contacts[0].phone && <span className="text-gray-400">📱 {d.customer.contacts[0].phone}</span>}
              {d.customer.contacts[0].email && <span className="text-gray-400">✉️ {d.customer.contacts[0].email}</span>}
              {d.customer.contacts[0].telegram && <span className="text-gray-400">💬 {d.customer.contacts[0].telegram}</span>}
            </div>
          )}
        </div>
      )}

      {/* Tasks */}
      {d.tasks && d.tasks.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Задачи ({d.tasks.length})</div>
          <div className="space-y-2">
            {d.tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`w-4 h-4 rounded border-2 ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-[#4338CA]'}`} />
                <span className={t.status === 'done' ? 'line-through text-gray-500' : ''}>{t.title}</span>
                {t.due_date && <span className="text-xs text-gray-500 ml-auto">{new Date(t.due_date).toLocaleDateString('ru-RU')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {d.documents && d.documents.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Документы ({d.documents.length})</div>
          <div className="space-y-2">
            {d.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm bg-[#2D2A6E] rounded-lg px-3 py-2">
                <span>📄</span>
                <span className="flex-1">{doc.name}</span>
                <span className="text-xs text-gray-500">{doc.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">📄 Создать КП</button>
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">+ Задача</button>
        {d.status === 'open' && <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">✅ Выиграна</button>}
      </div>
    </div>
  )
}

function CreateDealModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', customer: '', amount: '', stage: STAGES[0].id })
  return (
    <Modal open={open} onClose={onClose} title="Новая сделка">
      <div className="space-y-4">
        <FormField label="Название сделки"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Разработка CRM" /></FormField>
        <FormField label="Клиент"><input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={inputClass} placeholder="ООО «Ромашка»" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Сумма (₽)"><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="500000" /></FormField>
          <FormField label="Стадия">
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputClass}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => { onClose(); onCreated() }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}

// ── Tasks Page ──────────────────────────────────────────────

export function TasksPage() {
  const mockTasks = [
    { title: 'Позвонить ООО «Ромашка»', deal: 'Сделка: CRM для Ромашки', time: '11:00', overdue: false, done: false, priority: 'urgent' },
    { title: 'Подготовить договор', deal: 'Сделка: CRM для Ромашки', time: 'просрочено', overdue: true, done: false, priority: 'urgent' },
    { title: 'Follow-up: отправить КП', deal: 'Лид: Запрос КП', time: '14:00', overdue: false, done: false, priority: 'high' },
    { title: 'Встреча с ТехноЛогик', deal: 'Сделка: Мобильное приложение', time: '14:00', overdue: false, done: false, priority: 'high' },
    { title: 'Follow-up звонок', deal: 'Сделка: Комплекс автоматизации', time: 'завтра', overdue: false, done: false, priority: 'medium' },
    { title: 'Отправить счёт', deal: 'Сделка: Поддержка серверов', time: '✓ выполнено', overdue: false, done: true, priority: 'medium' },
    { title: 'Обновить прайс-лист', deal: '—', time: 'без даты', overdue: false, done: false, priority: 'low' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Задачи</h1><p className="text-gray-400 text-sm mt-1">Сегодня: 4 · Просрочено: 1</p></div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">+ Новая задача</button>
      </div>
      <div className="space-y-5">
        {[
          { label: 'Просрочено 🔥', filter: (t: any) => t.overdue },
          { label: 'Сегодня', filter: (t: any) => !t.overdue && !t.done && t.time !== 'без даты' },
          { label: 'Без даты', filter: (t: any) => t.time === 'без даты' },
          { label: 'Выполнено', filter: (t: any) => t.done },
        ].map((g) => {
          const items = mockTasks.filter(g.filter)
          if (items.length === 0) return null
          return (
            <div key={g.label}>
              <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase">{g.label}</h2>
              <div className="space-y-1.5">
                {items.map((t) => (
                  <div key={t.title} className={`flex items-center gap-3 p-3 rounded-lg ${t.done ? 'opacity-50' : ''} ${t.overdue ? 'bg-red-500/5' : 'bg-[#1E1B4B]'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#4338CA]'}`}>
                      {t.done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${t.done ? 'line-through text-gray-500' : ''}`}>{t.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.deal}</div>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${t.overdue ? 'text-red-400 font-semibold' : t.done ? 'text-emerald-400' : 'text-gray-500'}`}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Placeholder pages ───────────────────────────────────────

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-16 text-center">
        <div className="text-6xl mb-4 opacity-50">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Раздел в разработке</h2>
        <p className="text-sm text-gray-500">Этот модуль будет реализован в следующей версии</p>
      </div>
    </div>
  )
}

export function CalendarPage() { return <PlaceholderPage title="Календарь" icon="📅" /> }
export function FinancePage() { return <PlaceholderPage title="Финансы" icon="💰" /> }
export function DocumentsPage() { return <PlaceholderPage title="Документы" icon="📄" /> }
export function AnalyticsPage() { return <PlaceholderPage title="Аналитика" icon="📈" /> }
