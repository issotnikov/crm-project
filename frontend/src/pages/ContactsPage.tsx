import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface Phone { type: string; number: string; label: string }
interface Email { type: string; address: string; label: string }
interface Contact {
  id: string; full_name: string; first_name: string; last_name: string; middle_name: string | null
  position: string | null; customer_name: string | null; customer_id: string | null
  is_primary: boolean; phones: Phone[]; emails: Email[]
  telegram: string | null; max_messenger: string | null; whatsapp: string | null; viber: string | null
  birth_date: string | null; notes: string; tags: string[]
  last_contact_at: string | null; created_at: string
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMessenger, setFilterMessenger] = useState('all')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadContacts() }, [])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const data = await api.getContacts(search || undefined)
      setContacts(data.data || [])
    } catch { setContacts([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(() => loadContacts(), 300)
    return () => clearTimeout(t)
  }, [search])

  const openContact = async (c: Contact) => {
    setSelected(c); setDetailLoading(true)
    try { const d = await api.getContactDetail(c.id); setSelected(d) }
    catch {}
    finally { setDetailLoading(false) }
  }

  let filtered = contacts
  if (filterMessenger === 'telegram') filtered = contacts.filter(c => c.telegram)
  if (filterMessenger === 'max') filtered = contacts.filter(c => c.max_messenger)
  if (filterMessenger === 'whatsapp') filtered = contacts.filter(c => c.whatsapp)

  const stats = {
    total: contacts.length,
    withTelegram: contacts.filter(c => c.telegram).length,
    withMax: contacts.filter(c => c.max_messenger).length,
    primary: contacts.filter(c => c.is_primary).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Контакты</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {stats.total} · Основных: {stats.primary}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Новый контакт
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени, телефону, должности..."
            className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Все', icon: '' },
            { key: 'telegram', label: '💬 TG', icon: '' },
            { key: 'max', label: '✉️ MAX', icon: '' },
            { key: 'whatsapp', label: '📱 WhatsApp', icon: '' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilterMessenger(tab.key)}
              className={"px-3 py-1.5 rounded-lg text-sm transition-colors " + (filterMessenger === tab.key ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts grid */}
      {loading ? <div className="text-center py-20 text-gray-400">Загрузка...</div>
        : filtered.length === 0 ? <div className="text-center py-20 text-gray-500">Контакты не найдены</div>
        : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} onClick={() => openContact(c)}
              className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4 hover:border-indigo-700 hover:shadow-lg transition-all cursor-pointer">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {initials(c.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{c.full_name}</span>
                    {c.is_primary && <span className="text-xs text-indigo-400">★</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{c.position}</div>
                  <div className="text-xs text-gray-600 truncate">{c.customer_name}</div>
                </div>
              </div>
              {/* Contact methods */}
              <div className="space-y-1 text-xs">
                {c.phones?.[0] && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>{c.phones[0].type === 'mobile' ? '📱' : '☎️'}</span>
                    <span>{c.phones[0].number}</span>
                  </div>
                )}
                {c.emails?.[0] && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>✉️</span>
                    <span className="truncate">{c.emails[0].address}</span>
                  </div>
                )}
              </div>
              {/* Messengers */}
              <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#312E81]">
                {c.telegram && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded">💬 TG</span>}
                {c.max_messenger && <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">✉️ MAX</span>}
                {c.whatsapp && <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">📱 WA</span>}
                {c.phones?.length > 1 && <span className="text-xs text-gray-500 ml-auto">+{c.phones.length - 1}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || ''} subtitle={selected?.position || ''} wide>
        {detailLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div>
          : selected ? <ContactDetail contact={selected} /> : null}
      </Drawer>

      {/* Create modal */}
      <CreateContactModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadContacts} />
    </div>
  )
}

function ContactDetail({ contact: c }: { contact: Contact }) {
  return (
    <div className="space-y-5">
      {/* Tags */}
      {c.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {c.tags.map(t => <span key={t} className="text-xs bg-[#2D2A6E] text-gray-300 px-2 py-1 rounded">{t}</span>)}
          {c.is_primary && <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2 py-1 rounded">★ Основной контакт</span>}
        </div>
      )}

      {/* Customer */}
      {c.customer_name && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Организация</div>
          <div className="text-sm font-medium">{c.customer_name}</div>
        </div>
      )}

      {/* Phones */}
      {c.phones?.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Телефоны</div>
          <div className="space-y-2">
            {c.phones.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">{p.type === 'mobile' ? '📱' : '☎️'}</span>
                <div className="flex-1">
                  <div className="text-sm font-mono">{p.number}</div>
                  <div className="text-xs text-gray-500">{p.label}</div>
                </div>
                <a href={'tel:' + p.number} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors">Позвонить</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {c.emails?.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Email</div>
          <div className="space-y-2">
            {c.emails.map((em, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">✉️</span>
                <div className="flex-1">
                  <div className="text-sm">{em.address}</div>
                  <div className="text-xs text-gray-500">{em.label}</div>
                </div>
                <a href={'mailto:' + em.address} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors">Написать</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messengers */}
      {(c.telegram || c.max_messenger || c.whatsapp || c.viber) && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Мессенджеры</div>
          <div className="grid grid-cols-2 gap-3">
            {c.telegram && (
              <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-3">
                <span className="text-lg">💬</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Telegram</div>
                  <div className="text-sm font-mono">{c.telegram}</div>
                </div>
              </div>
            )}
            {c.max_messenger && (
              <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-3">
                <span className="text-lg">✉️</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">MAX мессенджер</div>
                  <div className="text-sm font-mono">{c.max_messenger}</div>
                </div>
              </div>
            )}
            {c.whatsapp && (
              <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-3">
                <span className="text-lg">📱</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">WhatsApp</div>
                  <div className="text-sm font-mono">{c.whatsapp}</div>
                </div>
              </div>
            )}
            {c.viber && (
              <div className="flex items-center gap-2 bg-[#15102E] rounded-lg p-3">
                <span className="text-lg">📲</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Viber</div>
                  <div className="text-sm font-mono">{c.viber}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {c.notes && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Заметки</div>
          <p className="text-sm text-gray-400">{c.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {c.birth_date && <span>🎂 {new Date(c.birth_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>}
        {c.last_contact_at && <span>Последний контакт: {formatDate(c.last_contact_at)}</span>}
      </div>
    </div>
  )
}

function CreateContactModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', position: '', customer_name: '',
    phone_work: '', phone_mobile: '', email: '', telegram: '', max_messenger: '', notes: '',
  })

  const handleSave = async () => {
    const phones: any[] = []
    if (form.phone_work) phones.push({ type: 'work', number: form.phone_work, label: 'Рабочий' })
    if (form.phone_mobile) phones.push({ type: 'mobile', number: form.phone_mobile, label: 'Мобильный' })
    const emails: any[] = []
    if (form.email) emails.push({ type: 'work', address: form.email, label: 'Рабочий' })

    try {
      await api.createContact({
        first_name: form.first_name, last_name: form.last_name,
        position: form.position, customer_name: form.customer_name,
        phones, emails,
        telegram: form.telegram || null,
        max_messenger: form.max_messenger || null,
        notes: form.notes,
      })
    } catch {}
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый контакт">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Фамилия"><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} placeholder="Иванов" /></FormField>
          <FormField label="Имя"><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} placeholder="Иван" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Должность"><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputClass} placeholder="Директор" /></FormField>
          <FormField label="Организация"><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inputClass} placeholder="ООО «Ромашка»" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Телефон рабочий ☎️"><input value={form.phone_work} onChange={(e) => setForm({ ...form, phone_work: e.target.value })} className={inputClass} placeholder="+7 (495) 123-45-67" /></FormField>
          <FormField label="Телефон личный 📱"><input value={form.phone_mobile} onChange={(e) => setForm({ ...form, phone_mobile: e.target.value })} className={inputClass} placeholder="+7 (916) 123-45-67" /></FormField>
        </div>
        <FormField label="Email ✉️"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="ivanov@company.ru" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Telegram 💬"><input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className={inputClass} placeholder="@username" /></FormField>
          <FormField label="MAX мессенджер ✉️"><input value={form.max_messenger} onChange={(e) => setForm({ ...form, max_messenger: e.target.value })} className={inputClass} placeholder="username.max" /></FormField>
        </div>
        <FormField label="Заметки"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass + ' min-h-[60px] resize-y'} placeholder="Дополнительная информация..." /></FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
