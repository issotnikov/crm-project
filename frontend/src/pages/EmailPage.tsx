import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Modal, FormField, inputClass } from '../components/ui'

interface EmailMsg {
  id: string; folder: string; from_email: string; from_name: string
  to_email: string; to_name: string; subject: string; body_text: string
  date: string; is_read: boolean; is_starred: boolean
  has_attachments: boolean; attachments: any[]
  customer_name: string | null; customer_id: string | null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600) return Math.floor(diff / 60) + ' мин'
  if (diff < 86400) return Math.floor(diff / 3600) + ' ч'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function EmailPage() {
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox')
  const [messages, setMessages] = useState<EmailMsg[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmailMsg | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [status, setStatus] = useState<any>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [inbox, sent, st] = await Promise.all([
        api.getInbox(), api.getSentEmails(), api.getEmailStatus(),
      ])
      setMessages(folder === 'inbox' ? (inbox.data || []) : (sent.data || []))
      setStatus(st)
    } catch { setMessages([]) }
    finally { setLoading(false) }
  }

  const loadFolder = async (f: 'inbox' | 'sent') => {
    setFolder(f); setLoading(true)
    try {
      const data = f === 'inbox' ? await api.getInbox() : await api.getSentEmails()
      setMessages(data.data || [])
    } catch { setMessages([]) }
    finally { setLoading(false) }
  }

  const openMsg = (m: EmailMsg) => { setSelected(m) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Электронная почта</h1>
          <p className="text-gray-400 text-sm mt-1">
            {status?.mode === 'live' ? '✅ Подключено: ' + (status?.user || '') : '⚠️ Демо-режим (не настроено)'}
          </p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          ✏️ Написать
        </button>
      </div>

      {/* Folders */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => loadFolder('inbox')}
          className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (folder === 'inbox' ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
          📥 Входящие {status?.unread_count > 0 && <span className="ml-1.5 text-xs bg-red-500 px-1.5 py-0.5 rounded-full">{status.unread_count}</span>}
        </button>
        <button onClick={() => loadFolder('sent')}
          className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (folder === 'sent' ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
          📤 Отправленные
        </button>
      </div>

      {/* Message list */}
      {loading ? <div className="text-center py-20 text-gray-400">Загрузка...</div>
        : messages.length === 0 ? <div className="text-center py-20 text-gray-500">Нет писем</div>
        : (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
          {messages.map((m, i) => (
            <div key={m.id} onClick={() => openMsg(m)}
              className={"flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-[#252161] border-b border-[#312E81] last:border-0 " + (!m.is_read && folder === 'inbox' ? 'bg-indigo-500/5' : '')}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {initials(folder === 'inbox' ? m.from_name || m.from_email : m.to_name || m.to_email)}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!m.is_read && folder === 'inbox' && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                  <span className={"text-sm truncate " + (!m.is_read && folder === 'inbox' ? 'font-bold text-white' : 'font-medium text-gray-300')}>
                    {folder === 'inbox' ? (m.from_name || m.from_email) : '→ ' + (m.to_name || m.to_email)}
                  </span>
                  {m.is_starred && <span className="text-amber-400 text-xs">★</span>
                  }
                  {m.has_attachments && <span className="text-xs text-gray-500">📎</span>}
                  <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">{formatTime(m.date)}</span>
                </div>
                <div className={"text-sm truncate mt-0.5 " + (!m.is_read && folder === 'inbox' ? 'text-gray-200' : 'text-gray-400')}>
                  {m.subject}
                </div>
                <div className="text-xs text-gray-600 truncate mt-0.5">{m.body_text?.slice(0, 100)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.subject || ''} subtitle={selected ? (folder === 'inbox' ? 'От: ' + (selected.from_name || selected.from_email) : 'Кому: ' + (selected.to_name || selected.to_email)) : ''} wide>
        {selected ? <MessageDetail msg={selected} folder={folder} onReply={() => { setSelected(null); setShowCompose(true) }} /> : null}
      </Drawer>

      {/* Compose modal */}
      <ComposeModal open={showCompose} onClose={() => setShowCompose(false)} onSent={() => { setShowCompose(false); loadFolder('sent') }} />
    </div>
  )
}

function MessageDetail({ msg: m, folder, onReply }: { msg: EmailMsg; folder: string; onReply: () => void }) {
  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {initials(folder === 'inbox' ? m.from_name || m.from_email : m.to_name || m.to_email)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">
              {folder === 'inbox' ? (m.from_name || m.from_email) : (m.to_name || m.to_email)}
            </div>
            <div className="text-xs text-gray-500">
              {folder === 'inbox' ? m.from_email : m.to_email}
            </div>
          </div>
          <span className="text-xs text-gray-500">{new Date(m.date).toLocaleString('ru-RU')}</span>
        </div>
        {m.customer_name && (
          <div className="text-xs text-indigo-400 mt-2">👤 {m.customer_name}</div>
        )}
      </div>

      {/* Body */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{m.body_text}</pre>
      </div>

      {/* Attachments */}
      {m.has_attachments && m.attachments.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">Вложения ({m.attachments.length})</div>
          <div className="space-y-2">
            {m.attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
                <span className="text-lg">📎</span>
                <div className="flex-1">
                  <div className="text-sm">{a.filename}</div>
                  <div className="text-xs text-gray-500">{Math.round(a.size / 1024)} KB</div>
                </div>
                <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg">Скачать</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {folder === 'inbox' && (
        <button onClick={onReply} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          ↩ Ответить
        </button>
      )}
    </div>
  )
}

function ComposeModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({ to: '', to_name: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSend = async () => {
    setSending(true); setResult(null)
    try {
      const r = await api.sendEmail({
        to_email: form.to, to_name: form.to_name,
        subject: form.subject, body: form.body,
      })
      setResult(r)
      if (r.ok) { setTimeout(() => { onClose(); onSent(); setForm({ to: '', to_name: '', subject: '', body: '' }) }, 1000) }
    } catch (e: any) { setResult({ ok: false, error: e.message }) }
    setSending(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Новое письмо">
      {result?.ok ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-lg font-semibold text-emerald-400">Письмо отправлено!</div>
          {result.mode === 'mock' && <div className="text-xs text-gray-500 mt-2">Демо-режим: реальная отправка не выполнена</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Кому (email)">
              <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={inputClass} placeholder="client@company.ru" />
            </FormField>
            <FormField label="Имя (опц.)">
              <input value={form.to_name} onChange={(e) => setForm({ ...form, to_name: e.target.value })} className={inputClass} placeholder="Иван Иванов" />
            </FormField>
          </div>
          <FormField label="Тема">
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass} placeholder="Тема письма" />
          </FormField>
          <FormField label="Текст письма">
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputClass + ' min-h-[180px] resize-y'} placeholder="Здравствуйте, ..."/>
          </FormField>
          {result && !result.ok && (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">❌ {result.error}</div>
          )}
        </div>
      )}
      {!result?.ok && (
        <div className="flex gap-3 mt-6">
          <button onClick={handleSend} disabled={sending || !form.to || !form.subject}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
            {sending ? '⏳ Отправка...' : '📤 Отправить'}
          </button>
          <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
        </div>
      )}
    </Modal>
  )
}
