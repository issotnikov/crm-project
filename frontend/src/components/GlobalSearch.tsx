import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface SearchResult {
  type: 'customer' | 'lead' | 'deal'
  id: string
  title: string
  subtitle: string
  icon: string
  onClick: () => void
}

const TYPE_ICONS = {
  customer: '👥', lead: '📥', deal: '🎯',
}

export function GlobalSearch({ onNavigate }: { onNavigate: (page: any, entityId?: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => doSearch(query), 250)
  }, [query])

  const doSearch = async (q: string) => {
    setLoading(true)
    const lower = q.toLowerCase()
    const found: SearchResult[] = []

    try {
      // Search customers
      const custData = await api.getCustomers(q)
      for (const c of (custData.data || []).slice(0, 5)) {
        found.push({
          type: 'customer', id: c.id,
          title: c.name,
          subtitle: 'Клиент' + (c.contacts?.[0]?.phone ? ' · 📱 ' + c.contacts[0].phone : ''),
          icon: '👥',
          onClick: () => { onNavigate('customers', c.id); setOpen(false); setQuery('') },
        })
      }
    } catch {}

    try {
      // Search leads
      const leadData = await api.getLeads()
      for (const l of (leadData.data || [])) {
        if (found.length >= 12) break
        if (l.title?.toLowerCase().includes(lower) || l.customer_name?.toLowerCase().includes(lower)) {
          found.push({
            type: 'lead', id: l.id,
            title: l.customer_name || l.title,
            subtitle: 'Заявка · ' + l.title,
            icon: '📥',
            onClick: () => { onNavigate('leads'); setOpen(false); setQuery('') },
          })
        }
      }
    } catch {}

    try {
      // Search deals
      const dealData = await api.getDeals()
      for (const d of (dealData.data || [])) {
        if (found.length >= 12) break
        if (d.title?.toLowerCase().includes(lower) || d.customer_name?.toLowerCase().includes(lower)) {
          found.push({
            type: 'deal', id: d.id,
            title: d.title,
            subtitle: 'Сделка · ' + d.customer_name + ' · ' + formatMoney(d.amount),
            icon: '🎯',
            onClick: () => { onNavigate('deals'); setOpen(false); setQuery('') },
          })
        }
      }
    } catch {}

    setResults(found)
    setHighlighted(0)
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && results[highlighted]) { results[highlighted].onClick() }
  }

  return (
    <div className="flex-1 max-w-md relative" ref={containerRef}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg pl-10 pr-16 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        placeholder="Поиск клиентов, сделок, заявок..."
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[#1E1B4B] border border-[#312E81] rounded px-1.5 py-0.5 text-gray-500 pointer-events-none">⌘K</span>

      {/* Dropdown results */}
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1147] border border-[#312E81] rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">🔍 Поиск...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Ничего не найдено по запросу «{query}»
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-[#312E81]">
                Найдено: {results.length}
              </div>
              {results.map((r, i) => (
                <button
                  key={r.type + r.id}
                  onClick={r.onClick}
                  onMouseEnter={() => setHighlighted(i)}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-[#312E81] last:border-0 " + (i === highlighted ? 'bg-indigo-600/20' : 'hover:bg-[#1E1B4B]')}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#2D2A6E] flex items-center justify-center text-base flex-shrink-0">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-xs text-gray-600">↵</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function formatMoney(n: number): string {
  if (n >= 1000000) return '₽' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '₽' + Math.round(n / 1000) + 'K'
  return '₽' + n
}
