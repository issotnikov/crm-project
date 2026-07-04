import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Badge } from '../components/ui'

type Tab = 'overview' | 'funnel' | 'managers' | 'sources'
type Period = 'week' | 'month' | 'quarter' | 'year'

function formatMoney(n: number): string {
  if (n >= 1000000) return n / 1000000 + 'M ₽'
  if (n >= 1000) return Math.round(n / 1000) + 'K ₽'
  return n + ' ₽'
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n)
}

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<Period>('month')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-gray-400 text-sm mt-1">Отчёты и показатели эффективности</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 bg-[#1E1B4B] rounded-lg p-1">
          {([['week', 'Неделя'], ['month', 'Месяц'], ['quarter', 'Квартал'], ['year', 'Год']] as [Period, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={"px-3 py-1.5 rounded-md text-xs font-medium transition-colors " + (period === key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ['overview', '📊 Обзор'], ['funnel', '🔻 Воронка'],
          ['managers', '👥 Сотрудники'], ['sources', '📡 Источники'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (tab === key ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && <OverviewTab period={period} />}
      {tab === 'funnel' && <FunnelTab period={period} />}
      {tab === 'managers' && <ManagersTab period={period} />}
      {tab === 'sources' && <SourcesTab period={period} />}
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────

function OverviewTab({ period }: { period: Period }) {
  const [data, setData] = useState<any>(null)
  const [revenue, setRevenue] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getAnalyticsOverview(period), api.getAnalyticsRevenue(period), api.getActivityHeatmap()])
      .then(([ov, rev, hm]) => { setData(ov); setRevenue(rev.data || []); setHeatmap(hm) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return <div className="text-center py-20 text-gray-400">Загрузка...</div>

  const k = data.kpis

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Лиды', value: k.leads, icon: '📥', trend: '+8%' },
          { label: 'Сделки', value: k.deals_created, icon: '🎯', trend: '+12%' },
          { label: 'Выиграно', value: k.deals_won, icon: '✅', trend: '+15%' },
          { label: 'Выручка', value: formatMoney(k.revenue), icon: '💰', trend: '+' + k.growth_pct + '%', highlight: true },
        ].map((c) => (
          <div key={c.label} className={"rounded-xl p-5 border " + (c.highlight ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#1E1B4B] border-[#312E81]')}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-gray-400">{c.label}</span>
              <span className="text-lg">{c.icon}</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            <div className="text-xs text-emerald-400 mt-1">↑ {c.trend}</div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Средний чек', value: formatMoney(k.avg_deal) },
          { label: 'Конверсия лид → сделка', value: k.conversion_lead_deal + '%' },
          { label: 'Конверсия сделка → won', value: k.conversion_deal_won + '%' },
          { label: 'Рост к прошлому периоду', value: '+' + k.growth_pct + '%' },
        ].map((c) => (
          <div key={c.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-lg font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue + Leads chart */}
      {revenue.length > 0 && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Выручка и лиды за 6 месяцев</h2>
          <RevenueLeadsChart data={revenue} />
        </div>
      )}

      {/* Activity heatmap */}
      {heatmap && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Активность по дням и часам</h2>
          <Heatmap hours={heatmap.hours} days={heatmap.days} grid={heatmap.grid} />
        </div>
      )}
    </div>
  )
}

// ── Funnel Tab ─────────────────────────────────────────────────

function FunnelTab({ period }: { period: Period }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getAnalyticsFunnel(period).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return <div className="text-center py-20 text-gray-400">Загрузка...</div>

  const maxCount = Math.max(...data.stages.map((s: any) => s.count), 1)

  return (
    <div className="space-y-5">
      {/* Funnel summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Общая конверсия</div>
          <div className="text-3xl font-bold text-emerald-400">{data.overall_conversion}%</div>
        </div>
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Средний цикл продаж</div>
          <div className="text-3xl font-bold">{data.avg_cycle_days} дн</div>
        </div>
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Проиграно сделок</div>
          <div className="text-3xl font-bold text-red-400">{data.lost_count}</div>
        </div>
      </div>

      {/* Funnel bars */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h2 className="text-base font-semibold mb-5">Воронка продаж</h2>
        <div className="space-y-3">
          {data.stages.map((s: any, i: number) => {
            const widthPct = (s.count / maxCount) * 100
            const hue = 250 - i * 25
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-40 text-sm text-gray-300 flex-shrink-0">{s.stage}</div>
                <div className="flex-1 h-10 bg-[#2D2A6E] rounded-lg overflow-hidden relative">
                  <div className="h-full rounded-lg flex items-center justify-between px-3 transition-all"
                    style={{ width: widthPct + '%', background: 'linear-gradient(90deg, hsl(' + hue + ',80%,55%), hsl(' + (hue + 20) + ',80%,62%))' }}>
                    <span className="text-white text-sm font-semibold">{s.count}</span>
                    {s.amount > 0 && <span className="text-white/80 text-xs">{formatMoney(s.amount)}</span>}
                  </div>
                </div>
                <div className="w-20 text-right text-xs text-gray-500 flex-shrink-0">
                  <div>{s.conv_to_next}% →</div>
                  <div className="text-gray-600">{s.conv_from_start}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lost reasons */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h2 className="text-base font-semibold mb-4">Причины проигрыша ({data.lost_count})</h2>
        <div className="space-y-2">
          {data.lost_reasons.map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-52 text-sm text-gray-300 flex-shrink-0">{r.reason}</div>
              <div className="flex-1 h-6 bg-[#2D2A6E] rounded-md overflow-hidden">
                <div className="h-full rounded-md bg-gradient-to-r from-red-600/60 to-red-500/40 flex items-center px-2 text-xs text-white"
                  style={{ width: r.pct + '%' }}>{r.count}</div>
              </div>
              <div className="w-12 text-right text-sm text-gray-400 tabular-nums">{r.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Managers Tab ───────────────────────────────────────────────

function ManagersTab({ period }: { period: Period }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getAnalyticsManagers(period).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return <div className="text-center py-20 text-gray-400">Загрузка...</div>

  const maxRevenue = Math.max(...data.data.map((m: any) => m.revenue), 1)
  const totals = data.totals

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всего лидов', value: totals.leads },
          { label: 'Сделок создано', value: totals.deals_created },
          { label: 'Выиграно', value: totals.deals_won },
          { label: 'Общая выручка', value: formatMoney(totals.revenue) },
        ].map((c) => (
          <div key={c.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-xl font-bold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue ranking */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h2 className="text-base font-semibold mb-4">Рейтинг по выручке</h2>
        <div className="space-y-3">
          {data.data.map((m: any, i: number) => (
            <div key={m.name} className="flex items-center gap-4">
              <div className="w-6 text-center text-sm font-bold text-gray-500">{i + 1}</div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </div>
              <div className="w-32 text-sm font-medium flex-shrink-0">{m.name}</div>
              <div className="flex-1 h-7 bg-[#2D2A6E] rounded-md overflow-hidden">
                <div className={"h-full rounded-md flex items-center px-3 text-xs text-white font-semibold " + (i === 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-700')}
                  style={{ width: (m.revenue / maxRevenue * 100) + '%' }}>
                  {formatMoney(m.revenue)}
                </div>
              </div>
              <div className="w-20 text-right text-xs text-gray-500 flex-shrink-0">{m.deals_won} сделок</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#312E81]">
          <h2 className="text-base font-semibold">Детальный отчёт по сотрудникам</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Сотрудник</th>
              <th className="text-center px-4 py-3 font-medium">Лиды</th>
              <th className="text-center px-4 py-3 font-medium">Сделки</th>
              <th className="text-center px-4 py-3 font-medium">Выиграно</th>
              <th className="text-center px-4 py-3 font-medium">Конв.</th>
              <th className="text-right px-4 py-3 font-medium">Выручка</th>
              <th className="text-right px-4 py-3 font-medium">Ср. чек</th>
              <th className="text-center px-4 py-3 font-medium">SLA</th>
              <th className="text-center px-4 py-3 font-medium">Задачи</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((m: any) => (
              <tr key={m.name} className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors">
                <td className="px-4 py-3 text-sm font-medium">{m.name}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-400 tabular-nums">{m.leads}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-400 tabular-nums">{m.deals_created}</td>
                <td className="px-4 py-3 text-center text-sm text-emerald-400 tabular-nums">{m.deals_won}</td>
                <td className="px-4 py-3 text-center text-sm tabular-nums">{m.conversion}%</td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatMoney(m.revenue)}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-400 tabular-nums">{formatMoney(m.avg_deal)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={"text-xs font-semibold " + (m.sla_rate >= 90 ? 'text-emerald-400' : m.sla_rate >= 80 ? 'text-amber-400' : 'text-red-400')}>{m.sla_rate}%</span>
                </td>
                <td className="px-4 py-3 text-center text-xs">
                  <span className="text-emerald-400">{m.tasks_done}</span>
                  {m.tasks_overdue > 0 && <span className="text-red-400 ml-1">/ {m.tasks_overdue}🔥</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Sources Tab ────────────────────────────────────────────────

function SourcesTab({ period }: { period: Period }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getAnalyticsSources(period).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return <div className="text-center py-20 text-gray-400">Загрузка...</div>

  const totalLeads = data.totals.leads
  const totalRevenue = data.totals.revenue

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всего лидов', value: totalLeads },
          { label: 'Выиграно', value: data.totals.won },
          { label: 'Выручка', value: formatMoney(totalRevenue) },
          { label: 'Расходы на маркетинг', value: formatMoney(data.totals.cost) },
        ].map((c) => (
          <div key={c.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-xl font-bold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Source comparison */}
      <div className="grid grid-cols-2 gap-5">
        {/* Leads by source (pie-like bars) */}
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Лиды по источникам</h2>
          <div className="space-y-3">
            {data.data.map((s: any) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{s.icon}</span>
                <div className="w-24 text-sm capitalize flex-shrink-0">{s.source}</div>
                <div className="flex-1 h-7 bg-[#2D2A6E] rounded-md overflow-hidden">
                  <div className="h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-400 flex items-center px-2 text-xs text-white font-medium"
                    style={{ width: (s.leads / totalLeads * 100) + '%' }}>{s.leads}</div>
                </div>
                <div className="w-12 text-right text-xs text-gray-400 tabular-nums">{Math.round(s.leads / totalLeads * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by source */}
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Выручка по источникам</h2>
          <div className="space-y-3">
            {data.data.map((s: any) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{s.icon}</span>
                <div className="w-24 text-sm capitalize flex-shrink-0">{s.source}</div>
                <div className="flex-1 h-7 bg-[#2D2A6E] rounded-md overflow-hidden">
                  <div className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center px-2 text-xs text-white font-medium"
                    style={{ width: (s.revenue / totalRevenue * 100) + '%' }}>{formatMoney(s.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROI table */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#312E81]"><h2 className="text-base font-semibold">ROI по источникам</h2></div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Источник</th>
              <th className="text-center px-4 py-3 font-medium">Лиды</th>
              <th className="text-center px-4 py-3 font-medium">Won</th>
              <th className="text-center px-4 py-3 font-medium">Конв.</th>
              <th className="text-right px-4 py-3 font-medium">Выручка</th>
              <th className="text-right px-4 py-3 font-medium">CPL</th>
              <th className="text-right px-4 py-3 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((s: any) => (
              <tr key={s.source} className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors">
                <td className="px-4 py-3 text-sm">{s.icon} <span className="capitalize">{s.source}</span></td>
                <td className="px-4 py-3 text-center text-sm text-gray-400 tabular-nums">{s.leads}</td>
                <td className="px-4 py-3 text-center text-sm text-emerald-400 tabular-nums">{s.won}</td>
                <td className="px-4 py-3 text-center text-sm tabular-nums">{s.conversion}%</td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{formatMoney(s.revenue)}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-400">{s.cpl > 0 ? formatMoney(s.cpl) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {s.roi >= 999999 ? (
                    <Badge status="won">∞</Badge>
                  ) : (
                    <span className={"text-sm font-semibold " + (s.roi >= 200 ? 'text-emerald-400' : s.roi >= 100 ? 'text-amber-400' : 'text-red-400')}>{s.roi}%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Charts ─────────────────────────────────────────────────────

function RevenueLeadsChart({ data }: { data: any[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const maxLeads = Math.max(...data.map(d => d.leads), 1)

  return (
    <div>
      <div className="flex items-end gap-4 h-48 mb-4">
        {data.map((m, i) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
            {/* Revenue bar */}
            <div className="w-full max-w-14 flex flex-col items-center justify-end h-full">
              <div className="text-xs font-semibold text-gray-400 tabular-nums mb-1">{(m.revenue / 1000000).toFixed(1)}M</div>
              <div className="w-full rounded-t-md bg-gradient-to-b from-indigo-500 to-indigo-700 hover:brightness-125 transition-all cursor-pointer"
                style={{ height: (m.revenue / maxRev * 80) + '%' }} title={formatMoney(m.revenue)} />
            </div>
            {/* Leads bar (smaller, secondary) */}
            <div className="w-full max-w-14 flex flex-col items-center justify-end h-1/3">
              <div className="w-2/3 rounded-t bg-emerald-500/60 hover:brightness-125 transition-all cursor-pointer"
                style={{ height: (m.leads / maxLeads * 60) + '%' }} title={m.leads + ' лидов'} />
            </div>
            <span className="text-xs text-gray-500">{m.label}</span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600" /> Выручка</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/60" /> Лиды</span>
      </div>
    </div>
  )
}

function Heatmap({ hours, days, grid }: { hours: string[]; days: string[]; grid: any[] }) {
  const allValues = grid.flatMap((g: any) => g.values)
  const maxVal = Math.max(...allValues, 1)

  function heatColor(val: number): string {
    const intensity = val / maxVal
    if (intensity > 0.75) return 'bg-indigo-500'
    if (intensity > 0.5) return 'bg-indigo-600/70'
    if (intensity > 0.3) return 'bg-indigo-700/50'
    if (intensity > 0.15) return 'bg-indigo-800/40'
    return 'bg-[#2D2A6E]'
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex gap-1 mb-1 ml-10">
          {hours.map(h => <div key={h} className="flex-1 text-center text-xs text-gray-500 min-w-[28px]">{h.split(':')[0]}</div>)}
        </div>
        {/* Grid */}
        {grid.map((row: any, ri: number) => (
          <div key={ri} className="flex items-center gap-1 mb-1">
            <div className="w-9 text-xs text-gray-400 text-right pr-1">{days[ri]}</div>
            {row.values.map((v: number, ci: number) => (
              <div key={ci} className={"flex-1 h-7 rounded min-w-[28px] flex items-center justify-center text-xs text-white/60 transition-transform hover:scale-110 cursor-pointer " + heatColor(v)}
                title={days[ri] + ' ' + hours[ci] + ' — ' + v + ' обращений'}>
                {v > 5 ? v : ''}
              </div>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-10 text-xs text-gray-500">
          <span>Меньше</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-3 rounded bg-[#2D2A6E]" />
            <div className="w-4 h-3 rounded bg-indigo-800/40" />
            <div className="w-4 h-3 rounded bg-indigo-700/50" />
            <div className="w-4 h-3 rounded bg-indigo-600/70" />
            <div className="w-4 h-3 rounded bg-indigo-500" />
          </div>
          <span>Больше</span>
        </div>
      </div>
    </div>
  )
}
