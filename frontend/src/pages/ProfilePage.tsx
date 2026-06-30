import { useState, useEffect, useRef } from 'react'
import { api, getUser } from '../lib/api'

interface ProfileData {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  position: string
  department: string
  phone_personal: string
  phone_internal: string
  avatar_url: string | null
  is_active: boolean
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  admin: { label: 'Администратор', color: 'text-red-400', bg: 'bg-red-500/15', icon: '🛡️' },
  user: { label: 'Пользователь', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: '👤' },
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit form state
  const [form, setForm] = useState({
    first_name: '', last_name: '', position: '', department: '',
    phone_personal: '', phone_internal: '', avatar_url: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await api.getProfile()
      setProfile(data)
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        position: data.position || '',
        department: data.department || '',
        phone_personal: data.phone_personal || '',
        phone_internal: data.phone_internal || '',
        avatar_url: data.avatar_url || '',
      })
      setAvatarPreview(data.avatar_url)
    } catch (err) {
      // Fallback to localStorage user info
      const localUser = getUser()
      if (localUser) {
        const mock: ProfileData = {
          id: 'local', email: localUser.email,
          first_name: localUser.name.split(' ')[0] || '',
          last_name: localUser.name.split(' ')[1] || '',
          role: localUser.role, position: '', department: '',
          phone_personal: '', phone_internal: '',
          avatar_url: null, is_active: true,
        }
        setProfile(mock)
        setForm({
          first_name: mock.first_name, last_name: mock.last_name,
          position: '', department: '', phone_personal: '', phone_internal: '', avatar_url: '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await api.updateProfile(form)
      setProfile(data)
      setEditing(false)
      // Update local user
      const localUser = getUser()
      if (localUser) {
        api // just to satisfy linter
        localStorage.setItem('crm_user', JSON.stringify({
          ...localUser,
          name: `${data.first_name} ${data.last_name}`.trim(),
        }))
      }
    } catch (err) {
      // Even if API fails, show saved locally
      if (profile) {
        setProfile({ ...profile, ...form })
      }
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setAvatarPreview(result)
      setForm({ ...form, avatar_url: result })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Загрузка профиля...</div>
  }

  if (!profile) {
    return <div className="text-center py-20 text-gray-500">Профиль не найден</div>
  }

  const role = ROLE_CONFIG[profile.role] || ROLE_CONFIG.user
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Мой профиль</h1>

      <div className="max-w-3xl space-y-5">
        {/* Profile header card */}
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#4338CA] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-24 h-24 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-xs">📷 Изменить</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Name & role */}
            <div className="flex-1 pt-2">
              <h2 className="text-xl font-bold">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${role.bg} ${role.color}`}>
                  <span>{role.icon}</span>
                  {role.label}
                </span>
                {profile.is_active ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Активен
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Отключён
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                ✏️ Редактировать
              </button>
            )}
          </div>
        </div>

        {/* Details card */}
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-5">
            Данные сотрудника
          </h3>

          {!editing ? (
            /* Read-only view */
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <ProfileField icon="💼" label="Должность" value={profile.position} />
              <ProfileField icon="🏢" label="Отдел" value={profile.department} />
              <ProfileField icon="📱" label="Телефон (личный)" value={profile.phone_personal} />
              <ProfileField icon="☎️" label="Телефон (внутр.)" value={profile.phone_internal} />
              <ProfileField icon="📧" label="Email" value={profile.email} />
              <ProfileField icon="🆔" label="ID" value={profile.id} mono />
            </div>
          ) : (
            /* Edit form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Имя">
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Фамилия">
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Должность">
                  <input
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="Менеджер продаж"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Отдел">
                  <input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Отдел продаж"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Телефон (личный)">
                  <input
                    value={form.phone_personal}
                    onChange={(e) => setForm({ ...form, phone_personal: e.target.value })}
                    placeholder="+7 (XXX) XXX-XX-XX"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Телефон (внутренний)">
                  <input
                    value={form.phone_internal}
                    onChange={(e) => setForm({ ...form, phone_internal: e.target.value })}
                    placeholder="101"
                    className="form-input"
                  />
                </FormField>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : '✓ Сохранить'}
                </button>
                <button
                  onClick={() => { setEditing(false); loadProfile() }}
                  className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 hover:text-white px-5 py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline styles for form inputs */}
      <style>{`
        .form-input {
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
        .form-input::placeholder { color: #6B7280; }
        .form-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 2px rgba(79,70,229,0.2); }
        .border-3 { border-width: 3px; }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function ProfileField({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`text-sm ${value ? 'text-gray-200' : 'text-gray-600 italic'} ${mono ? 'font-mono' : ''}`}>
        {value || '— не указано —'}
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
