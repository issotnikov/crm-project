import { useState, useEffect } from 'react'
import { api } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────
interface Lead {
  id: string
  title: string
  source: string
  status: string
  priority: string
  assigned_to: string | null
  score: number
  created_at: string
  customer_name?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Новый', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  in_progress: { label: 'В работе', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  qualified: { label: 'Квалифицирован', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  converted: { label: 'Конвертирован', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  rejected: { label: 'Отклонён', color: 'text-red-400', bg: 'bg-red-500/15' },
}

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  urgent: { dot: 'bg-red-500 shadow-red-500/50 shadow-md', label: 'Срочный' },
  high: { dot: 'bg-amber-500', label: 'Высокий' },
  medium: { dot: 'bg-blue-500', label: 'Средний' },
  low: { dot: 'bg-gray-500', label: 'Низкий' },
}

const SOURCE_ICONS: Record<string, string> = {
  telegram: '💬',
  email: '✉️',
  phone: '📞',
  web_form: '🌐',
  manual: '✏️',
  referral: '🤝',
}

// ── Mock data (used when API returns empty) ────────────────────
const MOCK_LEADS: Lead[] = [
  { id: '1', title: 'Нужна CRM система', source: 'telegram', status: 'new', priority: 'urgent', assigned_to: null, score: 85, created_at: '2026-06-28T10:30:00Z', customer_name: 'ООО «Ромашка»' },
  { id: '2', title: 'Запрос коммерческого предложения', source: 'email', status: 'new', priority: 'high', assigned_to: null, score: 72, created_at: '2026-06-28T10:15:00Z', customer_name: 'ИП Петров А.В.' },
  { id: '3', title: 'Интеграция с телефонии', source: 'phone', status: 'in_progress', priority: 'medium', assigned_to: 'user-1', score: 65, created_at: '2026-06-28T09:45:00Z', customer_name: 'ООО «ТехноЛогик»' },
  { id: '4', title: 'Форма обратной связи', source: 'web_form', status: 'in_progress', priority: 'medium', assigned_to: 'user-1', score: 58, created_at: '2026-06-28T08:20:00Z', customer_name: 'Анна Смирнова' },
  { id: '5', title: 'Вопрос по тарифам', source: 'telegram', status: 'qualified', priority: 'low', assigned_to: 'user-1', score: 45, created_at: '2026-06-27T16:00:00Z', customer_name: 'ООО «Гамма-Трейд»' },
  { id: '6', title: 'Демо платформы', source: 'email', status: 'qualified', priority: 'high', assigned_to: 'user-1', score: 78, created_at: '2026-06-27T14:30:00Z', customer_name: 'АО «Альфа»' },
  { id: '7', title: 'Установка модуля', source: 'referral', status: 'converted', priority: 'medium', assigned_to: 'user-1', score: 90, created_at: '2026-06-26T11:00:00Z', customer_name: 'ООО «Логистик+»' },
  { id: '8', title: 'Спам сообщение', source: 'email', status: 'rejected', priority: 'low', assigned_to: null, score: 10, created_at: '2026-06-26T10:00:00Z', customer_name: 'unknown' },
]

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return date.toLocaleDateString('ru-RU')
}

// ── Component ──────────────────────────────────────────────────
export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  useEffect(() => {
    api.getLeads()
      .then((data) => {
        const apiLeads = data.data || []
        setLeads(apiLeads.length > 0 ? apiLeads : MOCK_LEADS)
      })
      .catch(() => setLeads(MOCK_LEADS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
    return true
  })

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    in_progress: leads.filter((l) => l.status === 'in_progress').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    rejected: leads.filter((l) => l.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Заявки</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {leads.length} · Активных: {counts.new + counts.in_progress}</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <span>+</span> Новая заявка
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Все', count: counts.all },
          { key: 'new', label: 'Новые', count: counts.new, badge: 'bg-blue-500/15 text-blue-400' },
          { key: 'in_progress', label: 'В работе', count: counts.in_progress, badge: 'bg-amber-500/15 text-amber-400' },
          { key: 'qualified', label: 'Квал.', count: counts.qualified, badge: 'bg-purple-500/15 text-purple-400' },
          { key: 'converted', label: 'Конверт.', count: counts.converted, badge: 'bg-emerald-500/15 text-emerald-400' },
          { key: 'rejected', label: 'Отклон.', count: counts.rejected, badge: 'bg-red-500/15 text-red-400' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1E1B4B] text-gray-400 hover:text-white hover:bg-[#252161]'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded ${filter === tab.key ? 'bg-white/20' : tab.badge || 'bg-[#2D2A6E]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Source filter */}
      <div className="flex gap-2 mb-5">
        {['all', 'telegram', 'email', 'phone', 'web_form'].map((src) => (
          <button
            key={src}
            onClick={() => setSourceFilter(src)}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${
              sourceFilter === src
                ? 'bg-[#2D2A6E] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {src === 'all' ? '🔍 Все источники' : `${SOURCE_ICONS[src] || '📄'} ${src}`}
          </button>
        ))}
      </div>

      {/* Leads table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Нет заявок по фильтру</div>
      ) : (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
                <th className="text-left px-4 py-3 font-medium">Источник</th>
                <th className="text-left px-4 py-3 font-medium">Клиент / Заявка</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Приоритет</th>
                <th className="text-left px-4 py-3 font-medium">Скоринг</th>
                <th className="text-right px-4 py-3 font-medium">Время</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const st = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'text-gray-400', bg: 'bg-gray-500/15' }
                const pr = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.medium
                return (
                  <tr key={lead.id} className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2D2A6E] flex items-center justify-center text-base">
                        {SOURCE_ICONS[lead.source] || '📄'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{lead.customer_name || lead.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{lead.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
                        <span className="text-xs text-gray-400">{pr.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#2D2A6E] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${lead.score >= 70 ? 'bg-emerald-500' : lead.score >= 40 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(lead.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
