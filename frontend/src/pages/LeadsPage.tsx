import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface Lead {
  id: string; title: string; source: string; status: string; priority: string
  assigned_to_name: string | null; score: number; created_at: string
  customer_id: string; customer_name: string; description: string
  contacts: { name: string; phone: string; email: string; telegram: string | null }[]
  customer?: any
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', in_progress: 'В работе', qualified: 'Квалифицирован',
  converted: 'Конвертирован', rejected: 'Отклонён',
}
const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-gray-500',
}
const SOURCE_ICONS: Record<string, string> = {
  telegram: '💬', email: '✉️', phone: '📞', web_form: '🌐', manual: '✏️', referral: '🤝',
}

function formatTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  return `${Math.floor(diff / 86400)} дн`
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const data = await api.getLeads()
      setLeads(data.data || [])
    } catch { setLeads([]) }
    finally { setLoading(false) }
  }

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead)
    setDetailLoading(true)
    try {
      const detail = await api.getLeadDetail(lead.id)
      setSelectedLead(detail)
    } catch { /* use list data */ }
    finally { setDetailLoading(false) }
  }

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter)
  const counts: Record<string, number> = { all: leads.length }
  leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1 })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Заявки</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {leads.length}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Новая заявка
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'new', 'in_progress', 'qualified', 'converted', 'rejected'].map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === k ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white'}`}
          >
            {k === 'all' ? 'Все' : STATUS_LABELS[k] || k}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${filter === k ? 'bg-white/20' : 'bg-[#2D2A6E]'}`}>{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Нет заявок</div>
      ) : (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
                <th className="text-left px-4 py-3 font-medium">Источник</th>
                <th className="text-left px-4 py-3 font-medium">Клиент / Заявка</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Скоринг</th>
                <th className="text-right px-4 py-3 font-medium">Время</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2D2A6E] flex items-center justify-center text-base">
                      {SOURCE_ICONS[lead.source] || '📄'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{lead.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{lead.title}</div>
                  </td>
                  <td className="px-4 py-3"><Badge status={lead.status}>{STATUS_LABELS[lead.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#2D2A6E] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${lead.score >= 70 ? 'bg-emerald-500' : lead.score >= 40 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">{formatTime(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead detail drawer */}
      <Drawer
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.customer_name || 'Заявка'}
        subtitle={selectedLead?.title}
        wide
      >
        {detailLoading ? (
          <div className="text-center py-10 text-gray-400">Загрузка...</div>
        ) : selectedLead ? (
          <LeadDetail lead={selectedLead} />
        ) : null}
      </Drawer>

      {/* Create lead modal */}
      <CreateLeadModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadLeads} />
    </div>
  )
}

function LeadDetail({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-5">
      {/* Status & meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge status={lead.status}>{STATUS_LABELS[lead.status]}</Badge>
        <Badge>{PRIORITY_DOTS[lead.priority] && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOTS[lead.priority]}`} />}{lead.priority}</Badge>
        <span className="text-xs text-gray-500">{SOURCE_ICONS[lead.source]} {lead.source}</span>
        {lead.assigned_to_name && <span className="text-xs text-gray-500">👤 {lead.assigned_to_name}</span>}
      </div>

      {/* Description */}
      {lead.description && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Описание</div>
          <p className="text-sm text-gray-300">{lead.description}</p>
        </div>
      )}

      {/* Contacts */}
      {lead.contacts && lead.contacts.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Контакты</div>
          <div className="space-y-2">
            {lead.contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-300">{c.name}</span>
                {c.phone && <span className="text-gray-400">📱 {c.phone}</span>}
                {c.email && <span className="text-gray-400">✉️ {c.email}</span>}
                {c.telegram && <span className="text-gray-400">💬 {c.telegram}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">📞 Позвонить</button>
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">✉️ Написать</button>
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">💬 Telegram</button>
        {lead.status === 'new' && <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">Конвертировать в сделку</button>}
      </div>

      {/* Customer interactions timeline */}
      {lead.customer?.interactions && lead.customer.interactions.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-3">История взаимодействий</div>
          <div className="space-y-2">
            {lead.customer.interactions.map((inter: any) => (
              <div key={inter.id} className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{inter.type === 'message' ? '💬' : inter.type === 'call' ? '📞' : inter.type === 'email' ? '✉️' : inter.type === 'note' ? '📝' : '🤝'}</span>
                  <span className="text-xs text-gray-500">{inter.channel}</span>
                  {inter.direction && <span className="text-xs text-gray-600">{inter.direction === 'inbound' ? '←' : '→'}</span>}
                  <span className="text-xs text-gray-500 ml-auto">{new Date(inter.created_at).toLocaleString('ru-RU')}</span>
                </div>
                {inter.subject && <div className="text-sm font-medium">{inter.subject}</div>}
                <div className="text-sm text-gray-400 mt-1">{inter.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CreateLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', customer_name: '', source: 'manual', priority: 'medium',
    phone: '', email: '', telegram: '', description: '',
  })

  const handleSave = () => {
    // In production: api.createLead(form)
    // For demo: just close
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая заявка">
      <div className="space-y-4">
        <FormField label="Заголовок заявки">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Например: Запрос КП на CRM" />
        </FormField>
        <FormField label="Имя клиента">
          <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inputClass} placeholder="ООО «Ромашка» или Иван Иванов" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Источник">
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass}>
              <option value="manual">✏️ Ручной ввод</option>
              <option value="telegram">💬 Telegram</option>
              <option value="email">✉️ Email</option>
              <option value="phone">📞 Телефон</option>
              <option value="web_form">🌐 Сайт</option>
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
          <FormField label="Телефон">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+7 (XXX)..." />
          </FormField>
          <FormField label="Email">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="client@mail.ru" />
          </FormField>
        </div>
        <FormField label="Telegram">
          <input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className={inputClass} placeholder="@username" />
        </FormField>
        <FormField label="Описание">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Что нужно клиенту?" />
        </FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
