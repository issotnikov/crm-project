// Placeholder pages for sections not yet fully implemented

export function DealsPage() {
  const stages = ['Новый', 'Квалификация', 'КП отправлено', 'Переговоры', 'Договор', 'Выиграно']
  const mockDeals = [
    { title: 'CRM для Ромашки', amount: '₽500K', customer: 'ООО Ромашка', stage: 0, manager: 'ИП' },
    { title: 'Telegram-бот', amount: '₽200K', customer: 'ООО Мечта', stage: 1, manager: 'АС' },
    { title: 'Комплекс автоматизации', amount: '₽1.2M', customer: 'ТехноЛогик', stage: 2, manager: 'ИС' },
    { title: 'Мобильное приложение', amount: '₽800K', customer: 'Иванова О.С.', stage: 3, manager: 'ОК' },
    { title: 'SEO продвижение', amount: '₽300K', customer: 'Сидоров и партнёры', stage: 4, manager: 'ПИ' },
    { title: 'Поддержка серверов', amount: '₽500K', customer: 'Гамма-Трейд', stage: 5, manager: 'ИС' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Сделки</h1>
          <p className="text-gray-400 text-sm mt-1">Воронка: Основная · Активных: 6</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Новая сделка
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage, si) => {
          const deals = mockDeals.filter((d) => d.stage === si)
          return (
            <div key={stage} className="min-w-[260px] w-[260px] bg-[#15102E] rounded-xl flex flex-col">
              <div className="p-3 border-b border-[#312E81] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">{stage}</span>
                <span className="text-xs bg-[#2D2A6E] px-2 py-0.5 rounded-full text-gray-400">{deals.length}</span>
              </div>
              <div className="p-2.5 flex-1 space-y-2">
                {deals.map((deal) => (
                  <div key={deal.title} className="bg-[#1E1B4B] border border-[#312E81] rounded-lg p-3 hover:border-indigo-700 hover:shadow-lg transition-all cursor-grab">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-lg font-bold">{deal.amount}</span>
                      {si === 5 && <span className="text-xs text-emerald-400">✅</span>}
                    </div>
                    <div className="text-sm font-medium mb-1">{deal.title}</div>
                    <div className="text-xs text-gray-500 mb-2">{deal.customer}</div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#312E81]">
                      <span className="text-xs text-gray-500">💬 1</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                        {deal.manager}
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 border border-dashed border-[#312E81] rounded-lg text-xs text-gray-500 hover:border-indigo-600 hover:text-indigo-400 transition-colors">
                  + Добавить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CustomersPage() {
  const mockCustomers = [
    { name: 'ООО «Ромашка»', inn: '7701234567', status: 'active', manager: 'Иван П.', revenue: '₽1.2M', deals: 3 },
    { name: 'ИП Петров А.В.', inn: '780123456789', status: 'active', manager: 'Анна С.', revenue: '₽350K', deals: 2 },
    { name: 'ООО «ТехноЛогик»', inn: '7707654321', status: 'vip', manager: 'Игорь С.', revenue: '₽2.4M', deals: 5 },
    { name: 'АО «Альфа»', inn: '7709876543', status: 'active', manager: 'Ольга К.', revenue: '₽800K', deals: 2 },
    { name: 'ООО «Гамма-Трейд»', inn: '780567890123', status: 'active', manager: 'Игорь С.', revenue: '₽650K', deals: 1 },
  ]

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Активный', color: 'text-emerald-400 bg-emerald-500/15' },
    vip: { label: 'VIP', color: 'text-purple-400 bg-purple-500/15' },
    inactive: { label: 'Неактивный', color: 'text-gray-400 bg-gray-500/15' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Клиенты</h1>
          <p className="text-gray-400 text-sm mt-1">Всего клиентов: 5</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Новый клиент
        </button>
      </div>

      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#312E81] text-xs text-gray-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Клиент</th>
              <th className="text-left px-4 py-3 font-medium">ИНН</th>
              <th className="text-left px-4 py-3 font-medium">Статус</th>
              <th className="text-left px-4 py-3 font-medium">Менеджер</th>
              <th className="text-right px-4 py-3 font-medium">Выручка</th>
              <th className="text-right px-4 py-3 font-medium">Сделок</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map((c) => {
              const st = statusConfig[c.status] || statusConfig.active
              return (
                <tr key={c.name} className="border-b border-[#312E81] last:border-0 hover:bg-[#252161] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{c.inn}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.manager}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{c.revenue}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-400">{c.deals}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TasksPage() {
  const mockTasks = [
    { title: 'Позвонить ООО «Ромашка»', deal: 'Сделка #45', time: '11:00', overdue: false, done: false, priority: 'urgent' },
    { title: 'Подготовить договор', deal: 'Сделка #52', time: 'просрочено', overdue: true, done: false, priority: 'urgent' },
    { title: 'Follow-up: отправить КП', deal: 'Лид #78', time: '14:00', overdue: false, done: false, priority: 'high' },
    { title: 'Встреча с ТехноЛогик', deal: 'Сделка #60', time: '14:00', overdue: false, done: false, priority: 'high' },
    { title: 'Отправить счёт', deal: 'Сделка #45', time: '✓ 10:15', overdue: false, done: true, priority: 'medium' },
    { title: 'Обновить прайс-лист', deal: '—', time: 'без даты', overdue: false, done: false, priority: 'low' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-gray-400 text-sm mt-1">Сегодня: 4 · Просрочено: 1</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Новая задача
        </button>
      </div>

      <div className="space-y-5">
        {[
          { label: 'Просрочено 🔥', filter: (t: any) => t.overdue },
          { label: 'Сегодня', filter: (t: any) => !t.overdue && !t.done && t.time !== 'без даты' },
          { label: 'Без даты', filter: (t: any) => t.time === 'без даты' },
          { label: 'Выполнено', filter: (t: any) => t.done },
        ].map((group) => {
          const items = mockTasks.filter(group.filter)
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">{group.label}</h2>
              <div className="space-y-1.5">
                {items.map((task) => (
                  <div key={task.title} className={`flex items-center gap-3 p-3 rounded-lg ${task.done ? 'opacity-50' : ''} ${task.overdue ? 'bg-red-500/5' : ''}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-[#4338CA]'}`}>
                      {task.done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${task.done ? 'line-through text-gray-500' : ''}`}>{task.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{task.deal}</div>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${task.overdue ? 'text-red-400 font-semibold' : task.done ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {task.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-16 text-center">
        <div className="text-6xl mb-4 opacity-50">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Раздел в разработке</h2>
        <p className="text-sm text-gray-500">Этот модуль будет реализован в следующей версии</p>
      </div>
    </div>
  )
}

export function CalendarPage() { return <PlaceholderPage title="Календарь" icon="📅" /> }
export function FinancePage() { return <PlaceholderPage title="Финансы" icon="💰" /> }
export function DocumentsPage() { return <PlaceholderPage title="Документы" icon="📄" /> }
export function AnalyticsPage() { return <PlaceholderPage title="Аналитика" icon="📈" /> }
