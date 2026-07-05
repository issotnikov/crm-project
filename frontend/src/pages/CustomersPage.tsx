import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface Contact {
  id: string; first_name: string; last_name: string; position: string | null
  phone: string | null; email: string | null; telegram: string | null; max_messenger: string | null
  is_primary: boolean
}
interface Customer {
  id: string; name: string; inn: string | null; industry: string | null
  status: string; source: string; responsible_manager_name: string | null
  total_revenue: number; deals_count: number; created_at: string
  contacts: Contact[]; interactions: any[]
}

const STATUS_LABELS: Record<string, string> = { active: 'Активный', vip: 'VIP', inactive: 'Неактивный', blacklist: 'Чёрный список' }
const SOURCE_ICONS: Record<string, string> = { telegram: '💬', email: '✉️', phone: '📞', web_form: '🌐', manual: '✏️', referral: '🤝' }

function formatRevenue(n: number): string {
  if (n >= 1000000) return "₽" + (n / 1000000).toFixed(1) + "M"
  if (n > 0) return "₽" + (n / 1000).toFixed(0) + "K"
  return "—"
}

function initials(first: string, last: string): string {
  return ((first[0] || '') + (last[0] || '')).toUpperCase()
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await api.getCustomers(search || undefined)
      setCustomers(data.data || [])
    } catch { setCustomers([]) }
    finally { setLoading(false) }
  }

  const openCustomer = async (c: Customer) => {
    setSelected(c); setDetailLoading(true)
    try { const d = await api.getCustomerDetail(c.id); setSelected(d) }
    catch { /* use list data */ }
    finally { setDetailLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Клиенты</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {customers.length}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Новый клиент
        </button>
      </div>

      <div className="mb-4 relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
          className={inputClass + " pl-9"}
          placeholder="Поиск по имени, ИНН..."
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Клиенты не найдены</div>
      ) : (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
                <th className="text-left px-4 py-3 font-medium">Клиент</th>
                <th className="text-left px-4 py-3 font-medium">Контакты</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Менеджер</th>
                <th className="text-right px-4 py-3 font-medium">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} onClick={() => openCustomer(c)} className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        {c.inn && <div className="text-xs text-gray-500">ИНН: {c.inn}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.contacts?.[0]?.phone && <div className="text-xs text-gray-400">📱 {c.contacts[0].phone}</div>}
                    {c.contacts?.[0]?.email && <div className="text-xs text-gray-400">✉️ {c.contacts[0].email}</div>}
                    {!c.contacts?.[0]?.phone && !c.contacts?.[0]?.email && <span className="text-xs text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge status={c.status}>{STATUS_LABELS[c.status] || c.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.responsible_manager_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatRevenue(c.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ""} subtitle={selected?.inn ? "ИНН: " + selected.inn : undefined} wide>
        {detailLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : selected ? <CustomerDetail customer={selected} /> : null}
      </Drawer>

      <CreateCustomerModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadCustomers} />
    </div>
  )
}

// ── Customer Detail with contact switcher ───────────────────────

function CustomerDetail({ customer: c }: { customer: Customer }) {
  // Find primary contact or first one
  const primaryIdx = c.contacts?.findIndex(ct => ct.is_primary) ?? -1
  const [activeContactIdx, setActiveContactIdx] = useState(primaryIdx >= 0 ? primaryIdx : 0)

  // Reset when customer changes
  useEffect(() => {
    const idx = c.contacts?.findIndex(ct => ct.is_primary) ?? -1
    setActiveContactIdx(idx >= 0 ? idx : 0)
  }, [c.id])

  const activeContact: Contact | null = (c.contacts && c.contacts.length > 0) ? c.contacts[activeContactIdx] : null
  const hasPhone = activeContact?.phone
  const hasEmail = activeContact?.email
  const hasTelegram = activeContact?.telegram
  const hasMax = activeContact?.max_messenger

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge status={c.status}>{STATUS_LABELS[c.status] || c.status}</Badge>
        <span className="text-xs text-gray-500">{SOURCE_ICONS[c.source]} {c.source}</span>
        {c.industry && <span className="text-xs text-gray-500">💼 {c.industry}</span>}
        {c.responsible_manager_name && <span className="text-xs text-gray-500">👤 {c.responsible_manager_name}</span>}
      </div>

      {/* ── Contact switcher ─────────────────────────────────── */}
      {c.contacts && c.contacts.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          {/* Tabs: switch between contacts */}
          {c.contacts.length > 1 && (
            <div className="flex gap-2 mb-4 pb-3 border-b border-[#312E81] overflow-x-auto">
              {c.contacts.map((ct, i) => (
                <button
                  key={ct.id}
                  onClick={() => setActiveContactIdx(i)}
                  className={"flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm " +
                    (i === activeContactIdx
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-[#2D2A6E] text-gray-400 hover:text-white hover:bg-[#363278]")}
                >
                  {/* Avatar */}
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 " +
                    (i === activeContactIdx ? "bg-white/20" : "bg-gradient-to-br from-indigo-500/50 to-purple-500/50")}>
                    {initials(ct.first_name, ct.last_name)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium leading-tight">{ct.first_name} {ct.last_name}</div>
                    {ct.position && <div className="text-[10px] opacity-70 leading-tight">{ct.position}</div>}
                  </div>
                  {ct.is_primary && <span className="text-xs text-amber-400" title="Основной контакт">★</span>}
                </button>
              ))}
            </div>
          )}

          {/* Active contact details */}
          {activeContact && (
            <div className="space-y-3">
              {/* Name + position */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                  {initials(activeContact.first_name, activeContact.last_name)}
                </div>
                <div>
                  <div className="text-base font-semibold">{activeContact.first_name} {activeContact.last_name}</div>
                  {activeContact.position && <div className="text-sm text-gray-400">{activeContact.position}</div>}
                  {activeContact.is_primary && <div className="text-xs text-amber-400">★ Основной контакт</div>}
                </div>
              </div>

              {/* Contact info rows */}
              <div className="grid grid-cols-2 gap-2">
                {hasPhone && (
                  <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-2.5">
                    <span className="text-base">📱</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-500 uppercase">Телефон</div>
                      <div className="text-sm font-mono truncate">{activeContact.phone}</div>
                    </div>
                  </div>
                )}
                {hasEmail && (
                  <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-2.5">
                    <span className="text-base">✉️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-500 uppercase">Email</div>
                      <div className="text-sm truncate">{activeContact.email}</div>
                    </div>
                  </div>
                )}
                {hasTelegram && (
                  <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-2.5">
                    <span className="text-base">💬</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-500 uppercase">Telegram</div>
                      <div className="text-sm font-mono truncate">{activeContact.telegram}</div>
                    </div>
                  </div>
                )}
                {hasMax && (
                  <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-2.5">
                    <span className="text-base">📨</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-500 uppercase">MAX мессенджер</div>
                      <div className="text-sm font-mono truncate">{activeContact.max_messenger}</div>
                    </div>
                  </div>
                )}
                {!hasPhone && !hasEmail && !hasTelegram && !hasMax && (
                  <div className="col-span-2 text-sm text-gray-500 text-center py-2">Нет контактных данных</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons — launch real apps ────────────────── */}
      {activeContact && (
        <div className="flex gap-2 flex-wrap">
          {hasPhone && (
            <a href={"tel:" + (activeContact.phone || "").replace(/[^+\d]/g, '')}
               className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5">
              📞 Позвонить
            </a>
          )}
          {hasEmail && (
            <a href={"mailto:" + activeContact.email}
               className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5">
              ✉️ Email
            </a>
          )}
          {hasTelegram && (
            <a href={"https://t.me/" + (activeContact.telegram || "").replace('@', '')}
               target="_blank" rel="noopener noreferrer"
               className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5">
              💬 Telegram
            </a>
          )}
          {hasMax && (
            <a href={"max:" + activeContact.max_messenger}
               className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5">
              📨 MAX
            </a>
          )}
          <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
            + Сделка
          </button>
        </div>
      )}

      {/* ── Interactions history ─────────────────────────────── */}
      {c.interactions && c.interactions.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-3">История взаимодействий</div>
          <div className="space-y-2">
            {c.interactions.map((inter) => (
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

function CreateCustomerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', inn: '', phone: '', email: '', telegram: '', max_messenger: '', industry: '' })
  return (
    <Modal open={open} onClose={onClose} title="Новый клиент">
      <div className="space-y-4">
        <FormField label="Наименование"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="ООО «Ромашка»" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="ИНН"><input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} className={inputClass} /></FormField>
          <FormField label="Отрасль"><input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass} placeholder="IT" /></FormField>
        </div>
        <div className="text-xs text-gray-500 uppercase mt-2">Контактное лицо</div>
        <FormField label="Телефон"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+7..." /></FormField>
        <FormField label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="user@company.ru" /></FormField>
        <FormField label="MAX мессенджер"><input value={form.max_messenger || ""} onChange={(e) => setForm({ ...form, max_messenger: e.target.value })} className={inputClass} placeholder="username.max" /></FormField>
        <FormField label="Telegram"><input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className={inputClass} placeholder="@username" /></FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => { onClose(); onCreated() }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
