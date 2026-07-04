import { useState, useEffect } from 'react'
import { api, getToken, clearTokens, getUser } from './lib/api'
import { LoginPage } from './pages/LoginPage'
import { LeadsPage } from './pages/LeadsPage'
import { CustomersPage } from './pages/CustomersPage'
import { TasksPage } from './pages/TasksPage'
import { CalendarPage } from './pages/CalendarPage'
import { ProfilePage } from './pages/ProfilePage'
import { UsersPage } from './pages/UsersPage'
import { DealsPage } from './pages/OtherPages'
import { FinancePage } from './pages/FinancePage'
import { DocumentsPage } from './pages/DocumentsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ReminderToasts } from './components/ReminderToasts'
import { GlobalSearch } from './components/GlobalSearch'
import { NotificationCenter } from './components/NotificationCenter'

type PageKey = 'dashboard' | 'leads' | 'deals' | 'customers' | 'tasks' | 'calendar' | 'finance' | 'documents' | 'analytics' | 'users' | 'profile'

interface DashboardData {
  kpis: { new_leads: number; active_deals: number; revenue_month: number; overdue_tasks: number }
  funnel: { stage_name: string; count: number; amount: number }[]
  revenue_chart: { month: string; amount: number }[]
}

const EMPTY_DASHBOARD: DashboardData = {
  kpis: { new_leads: 0, active_deals: 0, revenue_month: 0, overdue_tasks: 0 },
  funnel: [], revenue_chart: [],
}

function getNavItems(userRole: string) {
  const items: { key: PageKey; icon: string; label: string; badge?: number; adminOnly?: boolean }[] = [
    { key: 'dashboard', icon: '📊', label: 'Дашборд' },
    { key: 'leads', icon: '📥', label: 'Заявки', badge: 8 },
    { key: 'deals', icon: '🎯', label: 'Сделки' },
    { key: 'customers', icon: '👥', label: 'Клиенты' },
    { key: 'tasks', icon: '✅', label: 'Задачи', badge: 5 },
    { key: 'calendar', icon: '📅', label: 'Календарь' },
    { key: 'finance', icon: '💰', label: 'Финансы' },
    { key: 'documents', icon: '📄', label: 'Документы' },
    { key: 'analytics', icon: '📈', label: 'Аналитика' },
  ]
  if (userRole === 'admin') items.push({ key: 'users', icon: '🛡️', label: 'Пользователи', adminOnly: true })
  return items
}

function formatRub(n: number): string {
  if (n >= 1_000_000) return "₽" + (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return "₽" + (n / 1_000).toFixed(0) + "K"
  return "₽" + n
}

function Sidebar({ activePage, onNavigate, user, onLogout }: {
  activePage: PageKey; onNavigate: (p: PageKey) => void
  user: { name: string; email: string; role: string }; onLogout: () => void
}) {
  const navItems = getNavItems(user.role)
  const isAdmin = user.role === 'admin'
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="w-60 min-h-screen bg-[#1A1147] border-r border-[#312E81] flex flex-col">
      <div className="p-5 flex items-center gap-2 border-b border-[#312E81]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">C</div>
        <span className="font-bold text-base">CRM System</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <button key={item.key} onClick={() => onNavigate(item.key)}
            className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm " + (activePage === item.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:bg-[#1E1B4B] hover:text-white')}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className={"ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full " + (activePage === item.key ? 'bg-white/20' : 'bg-red-500 text-white')}>{item.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[#312E81] space-y-1">
        <button onClick={() => onNavigate('profile')} className={"w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors " + (activePage === 'profile' ? 'bg-[#1E1B4B]' : 'hover:bg-[#1E1B4B]')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{isAdmin ? '🛡️ Администратор' : '👤 Пользователь'}</div>
          </div>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
          <span>⏻</span><span>Выйти</span>
        </button>
      </div>
    </aside>
  )
}

function TopBar({ title, subtitle, onNavigate }: { title: string; subtitle: string; onNavigate: (p: any) => void }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <GlobalSearch onNavigate={onNavigate} />
      <NotificationCenter onNavigate={onNavigate} />
      <div className="text-xs text-gray-500 hidden md:block">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    </div>
  )
}

function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState(true)

  useEffect(() => {
    api.getDashboard()
      .then((d) => { setData(d); setApiConnected(true) })
      .catch(() => {
        setApiConnected(false)
        setData({
          kpis: { new_leads: 142, active_deals: 24, revenue_month: 4_200_000, overdue_tasks: 3 },
          funnel: [
            { stage_name: 'Новый лид', count: 142, amount: 0 },
            { stage_name: 'Квалификация', count: 95, amount: 8_500_000 },
            { stage_name: 'КП отправлено', count: 58, amount: 6_200_000 },
            { stage_name: 'Переговоры', count: 45, amount: 5_100_000 },
            { stage_name: 'Договор', count: 40, amount: 4_600_000 },
            { stage_name: 'Выиграно', count: 38, amount: 4_200_000 },
          ],
          revenue_chart: [
            { month: 'Янв', amount: 3_100_000 }, { month: 'Фев', amount: 3_500_000 },
            { month: 'Мар', amount: 3_800_000 }, { month: 'Апр', amount: 3_600_000 },
            { month: 'Май', amount: 3_700_000 }, { month: 'Июн', amount: 4_200_000 },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1)
  const maxRevenue = Math.max(...data.revenue_chart.map((r) => r.amount), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Доброе утро! 👋</h1>
      <p className="text-gray-400 text-sm mb-6">{loading ? 'Загрузка...' : apiConnected ? 'Данные из API' : 'Демо-данные'}</p>
      <div className="grid grid-cols-4 gap-5 mb-7">
        {[
          { label: 'Новые заявки', value: data.kpis.new_leads, icon: '📥' },
          { label: 'Активные сделки', value: data.kpis.active_deals, icon: '🎯' },
          { label: 'Выручка (мес)', value: formatRub(data.kpis.revenue_month), icon: '💰' },
          { label: 'Просрочено задач', value: data.kpis.overdue_tasks, icon: '✅' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5 hover:border-indigo-700 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-gray-400 font-medium">{kpi.label}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-blue-500/15">{kpi.icon}</div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Воронка продаж</h2>
          <div className="space-y-2">
            {data.funnel.map((stage, i) => (
              <div key={stage.stage_name} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-400 flex-shrink-0">{stage.stage_name}</span>
                <div className="flex-1 h-7 bg-[#2D2A6E] rounded-md overflow-hidden">
                  <div className="h-full rounded-md flex items-center px-3 text-xs font-semibold text-white" style={{ width: (stage.count / maxFunnel * 100) + '%', background: 'linear-gradient(90deg, hsl(' + (250 + i * 15) + ',80%,60%), hsl(' + (250 + i * 15 + 30) + ',80%,65%))' }}>{stage.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Выручка за 6 месяцев</h2>
          <div className="flex items-end gap-3 h-40">
            {data.revenue_chart.map((r, i) => (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                <div className={"w-full max-w-10 rounded-t-md transition-all hover:brightness-125 cursor-pointer " + (i === data.revenue_chart.length - 1 ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' : 'bg-gradient-to-b from-indigo-500 to-indigo-700')} style={{ height: (r.amount / maxRevenue * 100) + '%' }} title={formatRub(r.amount)} />
                <span className={"text-xs " + (i === data.revenue_chart.length - 1 ? 'text-emerald-400 font-semibold' : 'text-gray-500')}>{r.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState(false)
  const [page, setPage] = useState<PageKey>('dashboard')

  useEffect(() => { if (getToken()) setAuthed(true) }, [])

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />

  const user = getUser() || { name: 'Пользователь', email: '', role: 'user' }
  const subtitles: Record<PageKey, string> = {
    dashboard: 'Сводка за день', leads: 'Входящие заявки', deals: 'Воронка продаж',
    customers: 'База клиентов', tasks: 'Задачи и контроль', calendar: 'Календарь',
    finance: 'Счета и оплаты', documents: 'Документы', analytics: 'Отчёты',
    users: 'Управление пользователями', profile: 'Личные данные',
  }

  return (
    <div className="min-h-screen bg-[#0F0B2E] text-gray-100">
      <div className="flex">
        <Sidebar activePage={page} onNavigate={setPage} user={user} onLogout={() => { clearTokens(); setAuthed(false); setPage('dashboard') }} />
        <div className="flex-1 p-8 min-w-0">
          <TopBar title={page} subtitle={subtitles[page]} onNavigate={setPage} />
          {page === 'dashboard' && <DashboardPage />}
          {page === 'leads' && <LeadsPage />}
          {page === 'deals' && <DealsPage />}
          {page === 'customers' && <CustomersPage />}
          {page === 'tasks' && <TasksPage />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'finance' && <FinancePage />}
          {page === 'documents' && <DocumentsPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'users' && user.role === 'admin' && <UsersPage />}
          {page === 'profile' && <ProfilePage />}
        </div>
      </div>
      {/* Floating task reminders */}
      <ReminderToasts />
    </div>
  )
}

export default App
