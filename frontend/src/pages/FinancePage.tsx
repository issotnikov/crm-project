import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface InvoiceItem {
  name: string; quantity: number; unit: string; unit_price: number
  vat_rate: number; vat_amount: number; total: number
}
interface Payment {
  id: string; amount: number; payment_date: string; method: string; reference: string; status: string
}
interface Invoice {
  id: string; number: string; customer_name: string; deal_name: string | null
  issue_date: string; due_date: string
  subtotal: number; vat_amount: number; total: number; paid_amount: number
  status: string; payment_method: string | null; notes: string
  items: InvoiceItem[]; payments: Payment[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Черновик', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  sent: { label: 'Отправлен', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  partially_paid: { label: 'Частично', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  paid: { label: 'Оплачен', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  overdue: { label: 'Просрочен', color: 'text-red-400', bg: 'bg-red-500/15' },
  cancelled: { label: 'Отменён', color: 'text-gray-500', bg: 'bg-gray-500/10' },
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Банк', card: 'Карта', cash: 'Наличные',
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showPayment, setShowPayment] = useState<Invoice | null>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [invData, dashData] = await Promise.all([api.getInvoices(), api.getFinanceDashboard()])
      setInvoices(invData.data || [])
      setDashboard(dashData)
    } catch { setInvoices([]) }
    finally { setLoading(false) }
  }

  const openInvoice = async (inv: Invoice) => {
    setSelected(inv); setDetailLoading(true)
    try { const d = await api.getInvoiceDetail(inv.id); setSelected(d) }
    catch { /* use list data */ }
    finally { setDetailLoading(false) }
  }

  const filtered = filter === 'all' ? invoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft') : invoices.filter(i => i.status === filter)
  const counts: Record<string, number> = {}
  invoices.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-gray-400 text-sm mt-1">Счетов: {invoices.length}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Выставить счёт
        </button>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            { label: 'Оплачено', value: formatMoney(dashboard.paid), icon: '💚', sub: 'поступило' },
            { label: 'Ожидает оплаты', value: formatMoney(dashboard.pending), icon: '⏳', sub: 'отправлено' },
            { label: 'Просрочено', value: formatMoney(dashboard.overdue), icon: '🔴', sub: `${dashboard.overdue_invoices?.length || 0} счетов` },
            { label: 'За период', value: formatMoney(dashboard.total_month), icon: '📊', sub: 'общая сумма' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-400 font-medium">{kpi.label}</span>
                <span className="text-lg">{kpi.icon}</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      {dashboard?.payments_chart && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">Динамика оплат за 6 месяцев</h2>
          <div className="flex items-end gap-4 h-36">
            {(() => {
              const max = Math.max(...dashboard.payments_chart.map((m: any) => m.amount), 1)
              return dashboard.payments_chart.map((m: any, i: number) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold tabular-nums text-gray-400">{(m.amount / 1000000).toFixed(1)}M</div>
                  <div
                    className={"w-full max-w-12 rounded-t-md transition-all hover:brightness-125 cursor-pointer " + (i === dashboard.payments_chart.length - 1 ? "bg-gradient-to-b from-emerald-500 to-emerald-600" : "bg-gradient-to-b from-indigo-500 to-indigo-700")}
                    style={{ height: (m.amount / max * 100) + "%" }}
                  />
                  <span className={"text-xs " + (i === dashboard.payments_chart.length - 1 ? "text-emerald-400 font-semibold" : "text-gray-500")}>{m.month}</span>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'Все', count: invoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft').length },
          { key: 'sent', label: 'Отправлены', count: counts.sent || 0 },
          { key: 'partially_paid', label: 'Частично', count: counts.partially_paid || 0 },
          { key: 'paid', label: 'Оплачены', count: counts.paid || 0 },
          { key: 'overdue', label: '🔴 Просрочены', count: counts.overdue || 0 },
          { key: 'draft', label: 'Черновики', count: counts.draft || 0 },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={"px-3 py-1.5 rounded-lg text-sm transition-colors " + (filter === tab.key ? "bg-indigo-600 text-white" : "bg-[#1E1B4B] text-gray-400 hover:text-white")}>
            {tab.label}
            <span className={"ml-1.5 text-xs px-1.5 py-0.5 rounded " + (filter === tab.key ? "bg-white/20" : "bg-[#2D2A6E]")}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Invoices table */}
      {loading ? <div className="text-center py-20 text-gray-400">Загрузка...</div>
        : filtered.length === 0 ? <div className="text-center py-20 text-gray-500">Нет счетов</div>
        : (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
                <th className="text-left px-4 py-3 font-medium">№</th>
                <th className="text-left px-4 py-3 font-medium">Клиент</th>
                <th className="text-right px-4 py-3 font-medium">Сумма</th>
                <th className="text-right px-4 py-3 font-medium">Оплачено</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Срок</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
                return (
                  <tr key={inv.id} onClick={() => openInvoice(inv)}
                    className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-sm font-mono text-indigo-400">{inv.number}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{inv.customer_name}</div>
                      {inv.deal_name && <div className="text-xs text-gray-500 mt-0.5">{inv.deal_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatMoney(inv.total)}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {inv.paid_amount > 0 ? (
                        <span className={inv.paid_amount >= inv.total ? "text-emerald-400" : "text-amber-400"}>{formatMoney(inv.paid_amount)}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className={"inline-block px-2 py-0.5 rounded text-xs font-medium " + st.bg + " " + st.color}>{st.label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(inv.due_date)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? "Счёт " + selected.number : ""} subtitle={selected?.customer_name} wide>
        {detailLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div>
          : selected ? <InvoiceDetail invoice={selected} onPay={(inv) => { setSelected(null); setShowPayment(inv) }} /> : null}
      </Drawer>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal invoice={showPayment} onClose={() => setShowPayment(null)} onPaid={() => { setShowPayment(null); loadAll() }} />
      )}

      {/* Create invoice modal */}
      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadAll} />
    </div>
  )
}

function InvoiceDetail({ invoice: inv, onPay }: { invoice: Invoice; onPay: (inv: Invoice) => void }) {
  const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
  const balance = inv.total - inv.paid_amount

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={"inline-block px-2.5 py-1 rounded-lg text-sm font-medium " + st.bg + " " + st.color}>{st.label}</span>
        {inv.due_date && <span className="text-xs text-gray-500">📅 Срок оплаты: {formatDate(inv.due_date)}</span>}
        {inv.issue_date && <span className="text-xs text-gray-500">Выставлен: {formatDate(inv.issue_date)}</span>}
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Сумма</div>
          <div className="text-xl font-bold">{formatMoney(inv.total)}</div>
        </div>
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Оплачено</div>
          <div className={"text-xl font-bold " + (inv.paid_amount >= inv.total && inv.paid_amount > 0 ? "text-emerald-400" : inv.paid_amount > 0 ? "text-amber-400" : "")}>{inv.paid_amount > 0 ? formatMoney(inv.paid_amount) : "—"}</div>
        </div>
        <div className={"rounded-lg p-4 border " + (balance > 0 && inv.status !== 'cancelled' ? "bg-red-500/10 border-red-500/30" : "bg-[#1E1B4B] border-[#312E81]")}>
          <div className="text-xs text-gray-500 uppercase mb-1">К оплате</div>
          <div className={"text-xl font-bold " + (balance > 0 && inv.status !== 'cancelled' ? "text-red-400" : "text-emerald-400")}>{balance > 0 ? formatMoney(balance) : "0 ₽"}</div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
        <div className="text-xs text-gray-500 uppercase mb-3">Позиции счёта</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-[#312E81]">
              <th className="text-left pb-2 font-medium">Услуга</th>
              <th className="text-center pb-2 font-medium">Кол-во</th>
              <th className="text-right pb-2 font-medium">Цена</th>
              <th className="text-right pb-2 font-medium">НДС</th>
              <th className="text-right pb-2 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} className="border-b border-[#312E81] last:border-0">
                <td className="py-2.5 text-gray-300">{item.name}</td>
                <td className="py-2.5 text-center text-gray-400">{item.quantity} {item.unit}</td>
                <td className="py-2.5 text-right text-gray-400 tabular-nums">{formatMoney(item.unit_price)}</td>
                <td className="py-2.5 text-right text-gray-500 tabular-nums">{formatMoney(item.vat_amount)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#312E81]">
              <td colSpan={4} className="pt-3 text-right text-sm text-gray-400">Без НДС:</td>
              <td className="pt-3 text-right text-sm text-gray-400 tabular-nums">{formatMoney(inv.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right text-sm text-gray-400">НДС 20%:</td>
              <td className="text-right text-sm text-gray-400 tabular-nums">{formatMoney(inv.vat_amount)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right font-semibold pt-1">Итого:</td>
              <td className="text-right font-bold text-lg pt-1">{formatMoney(inv.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {inv.notes && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Назначение / Комментарий</div>
          <p className="text-sm text-gray-400">{inv.notes}</p>
        </div>
      )}

      {/* Payments history */}
      {inv.payments.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-3">История оплат</div>
          <div className="space-y-2">
            {inv.payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-base">💰</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{formatMoney(p.amount)}</div>
                  <div className="text-xs text-gray-500">{METHOD_LABELS[p.method] || p.method} · {formatDate(p.payment_date)} · {p.reference}</div>
                </div>
                <span className="text-xs text-emerald-400">✓ Подтверждено</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
        <div className="flex gap-2 flex-wrap">
          {balance > 0 && (
            <button onClick={() => onPay(inv)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              💰 Зарегистрировать оплату
            </button>
          )}
          <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">📄 Скачать PDF</button>
          <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">✉️ Отправить клиенту</button>
        </div>
      )}
    </div>
  )
}

function PaymentModal({ invoice, onClose, onPaid }: { invoice: Invoice; onClose: () => void; onPaid: () => void }) {
  const balance = invoice.total - invoice.paid_amount
  const [amount, setAmount] = useState(String(balance))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await api.registerPayment(invoice.id, { amount: parseFloat(amount), payment_date: date, method, reference }) }
    catch { /* mock ok */ }
    setSaving(false)
    onPaid()
  }

  return (
    <Modal open={true} onClose={onClose} title="Регистрация оплаты">
      <div className="mb-4 p-3 bg-[#2D2A6E] rounded-lg flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500">Счёт {invoice.number}</div>
          <div className="text-sm">{invoice.customer_name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Остаток к оплате</div>
          <div className="text-lg font-bold text-red-400">{formatMoney(balance)}</div>
        </div>
      </div>
      <div className="space-y-4">
        <FormField label="Сумма оплаты (₽)">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Дата оплаты">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Способ оплаты">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
              <option value="bank_transfer">🏦 Безналичный</option>
              <option value="card">💳 Карта / СБП</option>
              <option value="cash">💵 Наличные</option>
            </select>
          </FormField>
        </div>
        <FormField label="Назначение / № документа">
          <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="Платёжное поручение №..." />
        </FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Сохранение..." : "✓ Подтвердить оплату"}
        </button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}

function CreateInvoiceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ customer: '', description: '', amount: '', due_date: '' })

  const handleSave = async () => {
    try {
      await api.createInvoice({ customer_name: form.customer, description: form.description, amount: parseFloat(form.amount) || 0, due_date: form.due_date || undefined })
    } catch { /* mock ok */ }
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый счёт">
      <div className="space-y-4">
        <FormField label="Клиент">
          <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={inputClass} placeholder="ООО «Ромашка»" />
        </FormField>
        <FormField label="Описание услуги">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Внедрение CRM-системы" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Сумма без НДС (₽)">
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="500000" />
          </FormField>
          <FormField label="Срок оплаты">
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
          </FormField>
        </div>
        <div className="text-xs text-gray-500 bg-[#2D2A6E] rounded-lg p-3">
          НДС 20% будет рассчитан автоматически. Итого с НДС: <span className="font-semibold text-gray-300">{form.amount ? formatMoney(parseFloat(form.amount) * 1.2) : "0 ₽"}</span>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Выставить</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
