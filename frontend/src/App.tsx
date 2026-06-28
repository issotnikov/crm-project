import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// ── Types ─────────────────────────────────────────────────────────────
interface DashboardData {
  kpis: {
    new_leads: number
    active_deals: number
    revenue_month: number
    overdue_tasks: number
  }
  funnel: { stage_name: string; count: number; amount: number }[]
  revenue_chart: { month: string; amount: number }[]
}

const EMPTY: DashboardData = {
  kpis: { new_leads: 0, active_deals: 0, revenue_month: 0, overdue_tasks: 0 },
  funnel: [],
  revenue_chart: [],
}

// ── Helpers ───────────────────────────────────────────────────────────
function formatRub(n: number): string {
  if (n >= 1_000_000) return `₽${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₽${(n / 1_000).toFixed(0)}K`
  return `₽${n}`
}

// ── Component ─────────────────────────────────────────────────────────
function App() {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/analytics/dashboard`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => {
        // Fallback to mock data if backend is not running
        setError(e.message)
        setData({
          kpis: {
            new_leads: 142,
            active_deals: 24,
            revenue_month: 4_200_000,
            overdue_tasks: 3,
          },
          funnel: [
            { stage_name: 'Новый лид', count: 142, amount: 0 },
            { stage_name: 'Квалификация', count: 95, amount: 8_500_000 },
            { stage_name: 'КП отправлено', count: 58, amount: 6_200_000 },
            { stage_name: 'Переговоры', count: 45, amount: 5_100_000 },
            { stage_name: 'Договор', count: 40, amount: 4_600_000 },
            { stage_name: 'Выиграно', count: 38, amount: 4_200_000 },
          ],
          revenue_chart: [
            { month: 'Янв', amount: 3_100_000 },
            { month: 'Фев', amount: 3_500_000 },
            { month: 'Мар', amount: 3_800_000 },
            { month: 'Апр', amount: 3_600_000 },
            { month: 'Май', amount: 3_700_000 },
            { month: 'Июн', amount: 4_200_000 },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1)
  const maxRevenue = Math.max(...data.revenue_chart.map((r) => r.amount), 1)

  return (
    <div className="min-h-screen bg-[#0F0B2E] text-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 min-h-screen bg-[#1A1147] border-r border-[#312E81] flex flex-col">
          <div className="p-5 flex items-center gap-2 border-b border-[#312E81]">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-base">CRM System</span>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {[
              { icon: '📊', label: 'Дашборд', active: true },
              { icon: '📥', label: 'Заявки', badge: 8 },
              { icon: '🎯', label: 'Сделки' },
              { icon: '👥', label: 'Клиенты' },
              { icon: '✅', label: 'Задачи', badge: 5 },
              { icon: '📅', label: 'Календарь' },
              { icon: '💰', label: 'Финансы' },
              { icon: '📄', label: 'Документы' },
              { icon: '📈', label: 'Аналитика' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  item.active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-gray-400 hover:bg-[#1E1B4B] hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-1">Доброе утро! 👋</h1>
          <p className="text-gray-400 mb-6">
            {loading ? 'Загрузка...' : error ? 'Демо-данные (backend не подключен)' : 'Данные из API'}
          </p>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5 mb-7">
            {[
              { label: 'Новые заявки', value: data.kpis.new_leads, icon: '📥', color: 'blue' },
              { label: 'Активные сделки', value: data.kpis.active_deals, icon: '🎯', color: 'purple' },
              { label: 'Выручка (мес)', value: formatRub(data.kpis.revenue_month), icon: '💰', color: 'green' },
              { label: 'Просрочено задач', value: data.kpis.overdue_tasks, icon: '✅', color: 'orange' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5 hover:border-indigo-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm text-gray-400 font-medium">{kpi.label}</span>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-blue-500/15">
                    {kpi.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold tabular-nums">{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5 mb-5">
            <h2 className="text-base font-semibold mb-4">Воронка продаж</h2>
            <div className="space-y-2">
              {data.funnel.map((stage, i) => (
                <div key={stage.stage_name} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-gray-400 flex-shrink-0">{stage.stage_name}</span>
                  <div className="flex-1 h-7 bg-[#2D2A6E] rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center px-3 text-xs font-semibold text-white"
                      style={{
                        width: `${(stage.count / maxFunnel) * 100}%`,
                        background: `linear-gradient(90deg, hsl(${250 + i * 15}, 80%, 60%), hsl(${250 + i * 15 + 30}, 80%, 65%))`,
                      }}
                    >
                      {stage.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Выручка за 6 месяцев</h2>
            <div className="flex items-end gap-3 h-40">
              {data.revenue_chart.map((r, i) => (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full max-w-10 rounded-t-md transition-all hover:brightness-125 cursor-pointer ${
                      i === data.revenue_chart.length - 1
                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600'
                        : 'bg-gradient-to-b from-indigo-500 to-indigo-700'
                    }`}
                    style={{ height: `${(r.amount / maxRevenue) * 100}%` }}
                    title={formatRub(r.amount)}
                  />
                  <span className={`text-xs ${i === data.revenue_chart.length - 1 ? 'text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                    {r.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
