import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Drawer, Badge, Modal, FormField, inputClass } from '../components/ui'

interface DocVersion {
  version: number; created_at: string; created_by_name: string; change_note: string
}
interface DocItem {
  id: string; type: string; name: string; template_name: string
  customer_name: string; deal_name: string | null
  status: string; version: number; file_format: string; file_size: number
  created_by_name: string; created_at: string; updated_at: string
  sent_at: string | null; signed_at: string | null
  versions: DocVersion[]; preview_text: string
}
interface Template {
  id: string; name: string; type: string; description: string
  variables: string[]; file_format: string; is_active: boolean
  uses_count: number; last_used: string
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  quote: { icon: '📋', label: 'КП', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  contract: { icon: '📜', label: 'Договор', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  invoice: { icon: '🧾', label: 'Счёт', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  act: { icon: '✅', label: 'Акт', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  specification: { icon: '📐', label: 'Спецификация', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Черновик', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  generated: { label: 'Сгенерирован', color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  sent: { label: 'Отправлен', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  signed: { label: 'Подписан', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  paid: { label: 'Оплачен', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

function formatSize(bytes: number): string {
  if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + ' MB'
  if (bytes >= 1000) return Math.round(bytes / 1000) + ' KB'
  return bytes + ' B'
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<DocItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [view, setView] = useState<'docs' | 'templates'>('docs')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [docData, tplData] = await Promise.all([api.getDocuments(), api.getTemplates()])
      setDocs(docData.data || [])
      setTemplates(tplData.data || [])
    } catch { setDocs([]); setTemplates([]) }
    finally { setLoading(false) }
  }

  const openDoc = async (d: DocItem) => {
    setSelected(d); setDetailLoading(true)
    try { const detail = await api.getDocumentDetail(d.id); setSelected(detail) }
    catch { }
    finally { setDetailLoading(false) }
  }

  const filtered = typeFilter === 'all' ? docs : docs.filter(d => d.type === typeFilter)
  const counts: Record<string, number> = {}
  docs.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1 })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Документы</h1>
          <p className="text-gray-400 text-sm mt-1">
            {view === 'docs' ? `Документов: ${docs.length}` : `Шаблонов: ${templates.filter(t => t.is_active).length} активных`}
          </p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          📄 Сгенерировать
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('docs')} className={"px-3 py-1.5 rounded-lg text-sm transition-colors " + (view === 'docs' ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
          📁 Документы ({docs.length})
        </button>
        <button onClick={() => setView('templates')} className={"px-3 py-1.5 rounded-lg text-sm transition-colors " + (view === 'templates' ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
          📋 Шаблоны ({templates.length})
        </button>
      </div>

      {/* ── Documents view ──────────────────────────────────── */}
      {view === 'docs' && (
        <>
          {/* Type filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'all', label: 'Все', count: docs.length },
              { key: 'quote', label: '📋 КП', count: counts.quote || 0 },
              { key: 'contract', label: '📜 Договоры', count: counts.contract || 0 },
              { key: 'invoice', label: '🧾 Счета', count: counts.invoice || 0 },
              { key: 'act', label: '✅ Акты', count: counts.act || 0 },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
                className={"px-3 py-1.5 rounded-lg text-sm transition-colors " + (typeFilter === tab.key ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
                {tab.label}
                <span className={"ml-1.5 text-xs px-1.5 py-0.5 rounded " + (typeFilter === tab.key ? 'bg-white/20' : 'bg-[#2D2A6E]')}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Documents grid */}
          {loading ? <div className="text-center py-20 text-gray-400">Загрузка...</div>
            : filtered.length === 0 ? <div className="text-center py-20 text-gray-500">Нет документов</div>
            : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((d) => {
                const tc = TYPE_CONFIG[d.type] || { icon: '📄', label: d.type, color: 'text-gray-400', bg: 'bg-gray-500/15' }
                const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.draft
                return (
                  <div key={d.id} onClick={() => openDoc(d)}
                    className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4 hover:border-indigo-700 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={"w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 " + tc.bg}>{tc.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{d.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{d.customer_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={"px-2 py-0.5 rounded text-xs font-medium " + sc.bg + " " + sc.color}>{sc.label}</span>
                      <span className={"px-2 py-0.5 rounded text-xs font-medium " + tc.bg + " " + tc.color}>{tc.label}</span>
                      {d.version > 1 && <span className="text-xs text-gray-500">v{d.version}</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#312E81]">
                      <span>{formatDate(d.created_at)}</span>
                      <span>{formatSize(d.file_size)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Templates view ──────────────────────────────────── */}
      {view === 'templates' && (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => {
            const tc = TYPE_CONFIG[t.type] || { icon: '📄', label: t.type, color: '', bg: '' }
            return (
              <div key={t.id} className={"bg-[#1E1B4B] border rounded-xl p-5 " + (t.is_active ? 'border-[#312E81]' : 'border-[#312E81] opacity-60')}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={"w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 " + tc.bg}>{tc.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tc.label} · {t.file_format.toUpperCase()}</div>
                  </div>
                  {t.is_active ? (
                    <span className="text-xs text-emerald-400">● Активен</span>
                  ) : (
                    <span className="text-xs text-gray-500">○ Отключён</span>
                  )}
                </div>
                {t.description && <p className="text-xs text-gray-400 mb-3">{t.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-[#312E81]">
                  <span>Использований: {t.uses_count}</span>
                  <span>·</span>
                  <span>Последний: {formatDate(t.last_used)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.variables.slice(0, 4).map((v) => (
                    <span key={v} className="text-xs bg-[#2D2A6E] text-gray-400 px-1.5 py-0.5 rounded">{'{'}{v}{'}'}</span>
                  ))}
                  {t.variables.length > 4 && <span className="text-xs text-gray-500">+{t.variables.length - 4}</span>}
                </div>
                {t.is_active && (
                  <button onClick={() => setShowGenerate(true)} className="mt-3 w-full text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 py-1.5 rounded-lg transition-colors">
                    Использовать шаблон
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} subtitle={selected ? TYPE_CONFIG[selected.type]?.label : ''} wide>
        {detailLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div>
          : selected ? <DocumentDetail doc={selected} onClose={() => setSelected(null)} /> : null}
      </Drawer>

      {/* Generate modal */}
      <GenerateModal open={showGenerate} templates={templates} onClose={() => setShowGenerate(false)} onGenerated={() => { setShowGenerate(false); loadAll(); setView('docs') }} />
    </div>
  )
}

function DocumentDetail({ doc: d, onClose }: { doc: DocItem; onClose: () => void }) {
  const tc = TYPE_CONFIG[d.type] || { icon: '📄', label: d.type, color: '', bg: '' }
  const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.draft

  return (
    <div className="space-y-5">
      {/* Status & meta */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={"px-2 py-0.5 rounded text-xs font-medium " + sc.bg + " " + sc.color}>{sc.label}</span>
        <span className={"px-2 py-0.5 rounded text-xs font-medium " + tc.bg + " " + tc.color}>{tc.icon} {tc.label}</span>
        <span className="text-xs text-gray-500">v{d.version}</span>
        <span className="text-xs text-gray-500">{d.file_format.toUpperCase()} · {formatSize(d.file_size)}</span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
          <div className="text-xs text-gray-500">Клиент</div>
          <div className="text-gray-300">{d.customer_name}</div>
        </div>
        {d.deal_name && (
          <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
            <div className="text-xs text-gray-500">Сделка</div>
            <div className="text-gray-300">{d.deal_name}</div>
          </div>
        )}
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
          <div className="text-xs text-gray-500">Шаблон</div>
          <div className="text-gray-300 text-xs">{d.template_name}</div>
        </div>
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
          <div className="text-xs text-gray-500">Автор</div>
          <div className="text-gray-300">{d.created_by_name}</div>
        </div>
      </div>

      {/* Preview */}
      {d.preview_text && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Предпросмотр</div>
          <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono bg-[#0F0B2E] rounded-lg p-3 overflow-x-auto">{d.preview_text}</pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {d.status !== 'sent' && d.status !== 'signed' && d.status !== 'paid' && (
          <button
            onClick={async () => { try { await api.sendDocument(d.id) } catch {} onClose() }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ✉️ Отправить клиенту
          </button>
        )}
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">⬇ Скачать PDF</button>
        <button className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">🔄 Новая версия</button>
      </div>

      {/* Versions */}
      {d.versions && d.versions.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-3">История версий</div>
          <div className="space-y-2">
            {d.versions.slice().reverse().map((v, i) => (
              <div key={v.version} className="flex items-center gap-3 bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold " + (i === 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#2D2A6E] text-gray-500')}>
                  v{v.version}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{v.change_note}</div>
                  <div className="text-xs text-gray-500">{v.created_by_name} · {formatDate(v.created_at)}</div>
                </div>
                {i === 0 && <span className="text-xs text-indigo-400">текущая</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GenerateModal({ open, templates, onClose, onGenerated }: { open: boolean; templates: Template[]; onClose: () => void; onGenerated: () => void }) {
  const activeTemplates = templates.filter(t => t.is_active)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customer, setCustomer] = useState('')
  const [deal, setDeal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (activeTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(activeTemplates[0].id)
    }
  }, [templates])

  const handleGenerate = async () => {
    setSaving(true)
    try {
      await api.generateDocument({
        template_id: selectedTemplate,
        customer_name: customer || 'Клиент',
        deal_name: deal || '',
      })
    } catch { /* mock ok */ }
    setSaving(false)
    onGenerated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Генерация документа">
      <div className="space-y-4">
        {/* Template selection */}
        <FormField label="Выберите шаблон">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeTemplates.map((t) => {
              const tc = TYPE_CONFIG[t.type] || { icon: '📄', label: t.type, color: '', bg: '' }
              const isSel = selectedTemplate === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={"w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left " + (isSel ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#2D2A6E] border-[#312E81] hover:border-[#4338CA]')}
                >
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 " + tc.bg}>{tc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-gray-500">{tc.label} · {t.file_format.toUpperCase()}</div>
                  </div>
                  {isSel && <span className="text-indigo-400 text-sm">✓</span>}
                </button>
              )
            })}
          </div>
        </FormField>

        <FormField label="Клиент">
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputClass} placeholder="ООО «Ромашка»" />
        </FormField>
        <FormField label="Сделка (опционально)">
          <input value={deal} onChange={(e) => setDeal(e.target.value)} className={inputClass} placeholder="Разработка CRM" />
        </FormField>

        {/* Variables hint */}
        {selectedTemplate && (() => {
          const t = templates.find(t => t.id === selectedTemplate)
          if (!t) return null
          return (
            <div className="text-xs text-gray-500 bg-[#2D2A6E] rounded-lg p-3">
              Переменные шаблона: {t.variables.map(v => '{' + v + '}').join(' ')}
            </div>
          )
        })()}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleGenerate} disabled={saving || !selectedTemplate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? 'Генерация...' : '✓ Сгенерировать'}
        </button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
