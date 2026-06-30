import { useState, useEffect } from 'react'
import { api, getUser } from '../lib/api'

interface UserItem {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  position: string
  department: string
  phone_personal: string
  phone_internal: string
  is_active: boolean
  avatar_url: string | null
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Админ', color: 'text-red-400', bg: 'bg-red-500/15' },
  user: { label: 'Пользователь', color: 'text-blue-400', bg: 'bg-blue-500/15' },
}

const DEPARTMENTS = [
  'Руководство',
  'Отдел продаж',
  'Финансовый отдел',
  'Исполнение (Проекты)',
  'Маркетинг',
  'IT-отдел',
]

export function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const currentUser = getUser()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data.data || [])
    } catch {
      // Fallback mock
      setUsers([
        { id: '1', email: 'admin@crm.local', first_name: 'Администратор', last_name: 'Системный', role: 'admin', position: 'Системный администратор', department: 'Руководство', phone_personal: '+7 (495) 123-45-67', phone_internal: '101', is_active: true, avatar_url: null },
        { id: '2', email: 'ivan.petrov@crm.local', first_name: 'Иван', last_name: 'Петров', role: 'user', position: 'Менеджер продаж', department: 'Отдел продаж', phone_personal: '+7 (916) 555-12-34', phone_internal: '205', is_active: true, avatar_url: null },
        { id: '3', email: 'anna.smirnova@crm.local', first_name: 'Анна', last_name: 'Смирнова', role: 'user', position: 'Менеджер продаж', department: 'Отдел продаж', phone_personal: '+7 (921) 333-44-55', phone_internal: '206', is_active: true, avatar_url: null },
        { id: '4', email: 'igor.sidorov@crm.local', first_name: 'Игорь', last_name: 'Сидоров', role: 'user', position: 'Старший разработчик', department: 'Исполнение (Проекты)', phone_personal: '+7 (903) 777-88-99', phone_internal: '310', is_active: true, avatar_url: null },
        { id: '5', email: 'olga.kuznetsova@crm.local', first_name: 'Ольга', last_name: 'Кузнецова', role: 'user', position: 'Бухгалтер', department: 'Финансовый отдел', phone_personal: '+7 (495) 222-33-44', phone_internal: '401', is_active: true, avatar_url: null },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Загрузка...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {users.length} · Админов: {users.filter(u => u.role === 'admin').length}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Добавить
        </button>
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-2 gap-4">
        {users.map((u) => {
          const role = ROLE_CONFIG[u.role] || ROLE_CONFIG.user
          const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase()
          const isSelf = u.email === currentUser?.email
          return (
            <div
              key={u.id}
              className={`bg-[#1E1B4B] border rounded-xl p-5 transition-colors ${u.is_active ? 'border-[#312E81]' : 'border-[#312E81] opacity-60'}`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{u.first_name} {u.last_name}</span>
                    {isSelf && <span className="text-xs text-indigo-400">(вы)</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${role.bg} ${role.color}`}>{role.label}</span>
                    <span className="text-xs text-gray-400">{u.position}</span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setEditingUser(u)}
                  className="text-gray-500 hover:text-indigo-400 p-1 transition-colors text-sm"
                  title="Редактировать"
                >
                  ⚙️
                </button>
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-[#312E81] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">📱 Личный:</span>
                  <span className="text-gray-300 ml-1.5">{u.phone_personal || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">☎️ Внутр.:</span>
                  <span className="text-gray-300 ml-1.5">{u.phone_internal || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">🏢 Отдел:</span>
                  <span className="text-gray-300 ml-1.5">{u.department || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Статус:</span>
                  <span className={`ml-1.5 ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {u.is_active ? '● Активен' : '● Отключён'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add user modal */}
      {showAddForm && (
        <UserModal
          title="Новый пользователь"
          onClose={() => setShowAddForm(false)}
          onSave={async (data) => {
            try { await api.createUser(data) } catch { /* mock ok */ }
            setShowAddForm(false)
            loadUsers()
          }}
        />
      )}

      {/* Edit user modal */}
      {editingUser && (
        <UserModal
          title="Редактирование"
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (data) => {
            try { await api.updateUser(editingUser.email, data) } catch { /* mock ok */ }
            setEditingUser(null)
            loadUsers()
          }}
        />
      )}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────

interface UserModalProps {
  title: string
  user?: UserItem | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

function UserModal({ title, user, onClose, onSave }: UserModalProps) {
  const [form, setForm] = useState({
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'user',
    position: user?.position || '',
    department: user?.department || '',
    phone_personal: user?.phone_personal || '',
    phone_internal: user?.phone_internal || '',
    is_active: user?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const payload = user
      ? { ...form, email: undefined, password: undefined }
      : form
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1E1B4B] border border-[#312E81] rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Имя">
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="modal-input" />
            </Field>
            <Field label="Фамилия">
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="modal-input" />
            </Field>
          </div>

          {!user && (
            <>
              <Field label="Email">
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="modal-input" placeholder="user@crm.local" />
              </Field>
              <Field label="Пароль">
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="modal-input" />
              </Field>
            </>
          )}

          {/* Role selector */}
          <Field label="Роль">
            <div className="flex gap-2">
              {[
                { val: 'user', label: '👤 Пользователь', desc: 'Доступ к своим данным' },
                { val: 'admin', label: '🛡️ Администратор', desc: 'Полный доступ' },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => setForm({ ...form, role: r.val })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors border ${
                    form.role === r.val
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#2D2A6E] border-[#312E81] text-gray-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Должность">
            <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="modal-input" placeholder="Менеджер продаж" />
          </Field>

          <Field label="Отдел">
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="modal-input"
            >
              <option value="">— Выбрать —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Телефон (личный)">
              <input value={form.phone_personal} onChange={(e) => setForm({ ...form, phone_personal: e.target.value })} className="modal-input" placeholder="+7 (XXX)..." />
            </Field>
            <Field label="Телефон (внутр.)">
              <input value={form.phone_internal} onChange={(e) => setForm({ ...form, phone_internal: e.target.value })} className="modal-input" placeholder="101" />
            </Field>
          </div>

          {user && (
            <Field label="Статус">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-300">Аккаунт активен</span>
              </label>
            </Field>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : '✓ Сохранить'}
          </button>
          <button
            onClick={onClose}
            className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 px-5 py-2 rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>

        <style>{`
          .modal-input {
            width: 100%;
            background: #2D2A6E;
            border: 1px solid #312E81;
            border-radius: 8px;
            padding: 9px 12px;
            color: white;
            font-size: 14px;
            outline: none;
            transition: border-color 0.15s;
          }
          .modal-input::placeholder { color: #6B7280; }
          .modal-input:focus { border-color: #4F46E5; }
          select.modal-input option { background: #1E1B4B; }
        `}</style>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
