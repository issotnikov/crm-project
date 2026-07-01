import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Modal, FormField, inputClass } from '../components/ui'

interface CalendarEvent {
  id: string; title: string; description: string; type: string
  start_at: string; end_at: string; all_day: boolean; location: string | null
  organizer_name: string | null; customer_name: string | null; task_id: string | null
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  meeting: { icon: '🤝', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: 'Встреча' },
  call: { icon: '📞', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Звонок' },
  demo: { icon: '🖥️', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30', label: 'Демо' },
  reminder: { icon: '⏰', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Напоминание' },
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    const ed = new Date(e.start_at)
    return ed.getDate() === day.getDate() && ed.getMonth() === day.getMonth() && ed.getFullYear() === day.getFullYear()
  }).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const d = await api.getEvents()
      setEvents(d.data || [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }

  // Build calendar grid
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekday = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDay.getDate()

  // Previous month trailing days
  const prevMonth = new Date(year, month, 0)
  const prevDays: Date[] = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    prevDays.push(new Date(year, month - 1, prevMonth.getDate() - i))
  }

  // Current month days
  const currentDays: Date[] = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push(new Date(year, month, i))
  }

  // Next month leading days (fill to complete weeks)
  const nextDays: Date[] = []
  const totalCells = prevDays.length + currentDays.length
  const remaining = (7 - (totalCells % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    nextDays.push(new Date(year, month + 1, i))
  }

  const allDays = [...prevDays, ...currentDays, ...nextDays]
  const today = new Date()

  // Stats
  const todayEvents = getEventsForDay(events, today)
  const upcomingEvents = events.filter((e) => new Date(e.start_at) > today).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Календарь</h1>
          <p className="text-gray-400 text-sm mt-1">Событий сегодня: {todayEvents.length} · Всего: {events.length}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
          + Событие
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Calendar grid (2/3 width) */}
        <div className="col-span-2">
          <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="w-8 h-8 rounded-lg bg-[#2D2A6E] hover:bg-[#363278] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="w-8 h-8 rounded-lg bg-[#2D2A6E] hover:bg-[#363278] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                →
              </button>
            </div>

            {/* Today button */}
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDay(today) }}
              className="mb-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors"
            >
              Сегодня
            </button>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, i) => {
                const dayEvents = getEventsForDay(events, day)
                const isToday = isSameDay(day, today)
                const isCurrentMonth = day.getMonth() === month
                const isSelected = selectedDay && isSameDay(day, selectedDay)

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[72px] rounded-lg p-1.5 text-left transition-colors border ${
                      isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:border-[#4338CA]'
                    } ${isCurrentMonth ? 'bg-[#15102E]' : 'bg-transparent opacity-40'}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    {/* Event dots */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => {
                        const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.meeting
                        return (
                          <div key={e.id} className={`text-xs px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon} {!e.all_day && new Date(e.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: selected day events + upcoming */}
        <div className="space-y-4">
          {/* Selected day */}
          {selectedDay && (
            <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">
                {isSameDay(selectedDay, today) ? 'Сегодня' : selectedDay.toLocaleDateString('ru-RU', { weekday: 'long' })}
              </div>
              <div className="text-lg font-semibold mb-3">
                {selectedDay.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </div>
              {getEventsForDay(events, selectedDay).length === 0 ? (
                <div className="text-sm text-gray-500 py-3">Нет событий</div>
              ) : (
                <div className="space-y-2">
                  {getEventsForDay(events, selectedDay).map((e) => <EventCard key={e.id} event={e} />)}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">Ближайшие события</div>
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-500">Нет предстоящих событий</div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((e) => <EventCard key={e.id} event={e} compact />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create event modal */}
      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadEvents} defaultDate={selectedDay} />
    </div>
  )
}

function EventCard({ event: e, compact }: { event: CalendarEvent; compact?: boolean }) {
  const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.meeting
  const time = new Date(e.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`rounded-lg p-2.5 border ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm">{cfg.icon}</span>
        {!e.all_day && <span className="text-xs text-gray-400">{time}</span>}
        {e.all_day && <span className="text-xs text-gray-400">весь день</span>}
      </div>
      <div className="text-sm font-medium text-gray-200">{e.title}</div>
      {!compact && e.location && <div className="text-xs text-gray-500 mt-0.5">📍 {e.location}</div>}
      {!compact && e.customer_name && <div className="text-xs text-gray-500">👤 {e.customer_name}</div>}
      {!compact && e.organizer_name && <div className="text-xs text-gray-500">Организатор: {e.organizer_name}</div>}
    </div>
  )
}

function CreateEventModal({ open, onClose, onCreated, defaultDate }: { open: boolean; onClose: () => void; onCreated: () => void; defaultDate: Date | null }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'meeting',
    date: defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: '14:00', location: '',
  })

  const handleSave = async () => {
    const start_at = `${form.date}T${form.time}:00`
    const endDate = new Date(start_at)
    endDate.setHours(endDate.getHours() + 1)
    try {
      await api.createEvent({
        title: form.title,
        description: form.description,
        type: form.type,
        start_at,
        end_at: endDate.toISOString(),
        location: form.location || null,
      })
    } catch { /* mock ok */ }
    onClose()
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новое событие">
      <div className="space-y-4">
        <FormField label="Название">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Встреча с клиентом" />
        </FormField>
        <FormField label="Тип">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
            <option value="meeting">🤝 Встреча</option>
            <option value="call">📞 Звонок</option>
            <option value="demo">🖥️ Демо</option>
            <option value="reminder">⏰ Напоминание</option>
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Дата">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Время">
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} />
          </FormField>
        </div>
        <FormField label="Место / Ссылка">
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Zoom, переговорная..." />
        </FormField>
        <FormField label="Описание">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[60px] resize-y`} />
        </FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors">✓ Создать</button>
        <button onClick={onClose} className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors">Отмена</button>
      </div>
    </Modal>
  )
}
