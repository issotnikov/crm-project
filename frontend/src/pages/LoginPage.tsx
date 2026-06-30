import { useState } from 'react'
import { api, setTokens } from '../lib/api'

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@crm.local')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await api.login(email, password)
      setTokens(data.access_token, data.refresh_token)

      const user = {
        name: `${data.user.first_name} ${data.user.last_name}`.trim(),
        email: data.user.email,
        role: data.user.role,
        position: data.user.position,
        department: data.user.department,
      }
      localStorage.setItem('crm_user', JSON.stringify(user))

      onLogin()
    } catch (err: any) {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0B2E] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-2xl shadow-lg shadow-indigo-600/30">
            C
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CRM System</h1>
            <p className="text-sm text-gray-400">Войдите в систему</p>
          </div>
        </div>

        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="admin@crm.local"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Вход...
                </>
              ) : 'Войти'}
            </button>
          </form>

          {/* Quick login buttons */}
          <div className="mt-6 pt-5 border-t border-[#312E81] space-y-2">
            <p className="text-xs text-gray-500 text-center mb-3">Тестовые аккаунты (пароль любой):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('admin@crm.local'); setPassword('admin') }}
                className="bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 hover:border-red-500/50 transition-colors text-left"
              >
                <div className="text-red-400 font-medium">🛡️ Администратор</div>
                <div className="text-gray-500 mt-0.5">admin@crm.local</div>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('ivan.petrov@crm.local'); setPassword('user') }}
                className="bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 hover:border-blue-500/50 transition-colors text-left"
              >
                <div className="text-blue-400 font-medium">👤 Пользователь</div>
                <div className="text-gray-500 mt-0.5">ivan.petrov@crm.local</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
