import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Badge } from '../components/ui'

type Tab = 'api' | 'ldap' | 'oidc'

export function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>('api')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Интеграции и API</h1>
        <p className="text-gray-400 text-sm mt-1">Настройка внешних систем и документация API</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ['api', '📚 API каталог'], ['ldap', '🔑 LDAP / AD'], ['oidc', '🔐 OIDC / Keycloak'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (tab === key ? 'bg-indigo-600 text-white' : 'bg-[#1E1B4B] text-gray-400 hover:text-white')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'api' && <ApiCatalogTab />}
      {tab === 'ldap' && <LdapTab />}
      {tab === 'oidc' && <OidcTab />}
    </div>
  )
}

// ── API Catalog Tab ───────────────────────────────────────────

function ApiCatalogTab() {
  const [catalog, setCatalog] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/api-catalog/').then(r => r.json()),
      fetch('/api/v1/api-catalog/summary').then(r => r.json()),
    ]).then(([c, s]) => { setCatalog(c); setSummary(s) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Загрузка...</div>

  return (
    <div className="space-y-5">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Версия API', value: summary.version },
            { label: 'Модулей', value: summary.modules },
            { label: 'Endpoints', value: summary.total_endpoints },
            { label: 'Гайдов', value: summary.integration_guides },
          ].map(c => (
            <div key={c.label} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Auth */}
      {catalog?.auth && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-3">🔐 Авторизация</h2>
          <div className="text-xs text-gray-500 mb-3">Тип: <code className="bg-[#2D2A6E] px-2 py-0.5 rounded text-indigo-400">{catalog.auth.type}</code></div>
          <div className="space-y-1">
            {Object.entries(catalog.auth.endpoints).map(([key, desc]: [string, any]) => (
              <div key={key} className="text-sm text-gray-400 flex gap-2">
                <span className="text-gray-600">•</span> {desc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      {catalog?.modules?.map((mod: any) => (
        <div key={mod.name} className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{mod.icon}</span>
            <h2 className="text-base font-semibold">{mod.name}</h2>
            <code className="text-xs bg-[#2D2A6E] px-2 py-0.5 rounded text-indigo-400 ml-auto">{mod.base}</code>
          </div>
          <div className="space-y-1.5">
            {mod.endpoints.map((ep: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={"font-mono text-xs px-2 py-0.5 rounded font-bold " + methodColor(ep.method)}>{ep.method}</span>
                <code className="text-gray-400 text-xs flex-1 truncate">{ep.path}</code>
                <span className="text-gray-500 text-xs hidden md:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Integration guides */}
      {catalog?.integration_guides && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">📖 Инструкции по интеграции</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(catalog.integration_guides).map(([key, guide]: [string, any]) => (
              <div key={key} className="bg-[#15102E] border border-[#312E81] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">{guide.title}</h3>
                <div className="space-y-1">
                  {guide.steps.map((step: string, i: number) => (
                    <div key={i} className="text-xs text-gray-400">{step}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function methodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400',
    POST: 'bg-blue-500/15 text-blue-400',
    PUT: 'bg-amber-500/15 text-amber-400',
    PATCH: 'bg-purple-500/15 text-purple-400',
    DELETE: 'bg-red-500/15 text-red-400',
  }
  return colors[method] || 'bg-gray-500/15 text-gray-400'
}

// ── LDAP Tab ──────────────────────────────────────────────────

function LdapTab() {
  const [status, setStatus] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [presets, setPresets] = useState<Record<string, any>>({})
  const [selectedPreset, setSelectedPreset] = useState('ad')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/v1/integrations/ldap/status').then(r => r.json()).then(setStatus).catch(() => {})
    fetch('/api/v1/integrations/ldap/config').then(r => r.json()).then(setConfig).catch(() => {})
    // Load presets
    Promise.all([
      fetch('/api/v1/integrations/ldap/presets/ad').then(r => r.json()),
      fetch('/api/v1/integrations/ldap/presets/openldap').then(r => r.json()),
      fetch('/api/v1/integrations/ldap/presets/freeipa').then(r => r.json()),
    ]).then(([ad, ol, fi]) => setPresets({ ad, openldap: ol, freeipa: fi })).catch(() => {})
  }, [])

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('/api/v1/integrations/ldap/test-connection', { method: 'POST' })
      setTestResult(await r.json())
    } catch (e: any) { setTestResult({ ok: false, error: e.message }) }
    setTesting(false)
  }

  const currentPreset = presets[selectedPreset]

  return (
    <div className="space-y-5">
      {/* Status */}
      {status && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className={"w-3 h-3 rounded-full " + (status.enabled ? 'bg-emerald-500' : 'bg-gray-600')} />
            <h2 className="text-base font-semibold">LDAP / Active Directory</h2>
            <span className={"text-xs px-2 py-0.5 rounded-full " + (status.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-500')}>
              {status.enabled ? 'Настроен' : 'Не настроен'}
            </span>
            {!status.ldap3_installed && <Badge>Mock режим</Badge>}
          </div>
          {status.host && <div className="text-xs text-gray-500 mt-2">{status.server_type?.toUpperCase()} · {status.host}</div>}
        </div>
      )}

      {/* Preset selector */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Быстрая настройка — пресеты</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Object.entries(presets).map(([key, p]: [string, any]) => (
            <button key={key} onClick={() => setSelectedPreset(key)}
              className={"p-3 rounded-lg border text-left transition-colors " + (selectedPreset === key ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#15102E] border-[#312E81] hover:border-[#4338CA]')}>
              <div className="text-sm font-medium">{p?.name}</div>
            </button>
          ))}
        </div>
        {currentPreset && (
          <div className="bg-[#15102E] rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">{currentPreset.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Порт:</span> <span className="text-gray-300">{currentPreset.port}</span></div>
              <div><span className="text-gray-500">SSL:</span> <span className="text-gray-300">{currentPreset.use_ssl ? 'Да (LDAPS)' : 'Нет / StartTLS'}</span></div>
              <div><span className="text-gray-500">Фильтр:</span> <code className="text-indigo-400">{currentPreset.user_filter}</code></div>
              <div><span className="text-gray-500">Username attr:</span> <code className="text-indigo-400">{currentPreset.attr_username}</code></div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration form */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Параметры подключения</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['LDAP_HOST', 'Сервер', 'ldap.corp.local'],
            ['LDAP_PORT', 'Порт', '636'],
            ['LDAP_BIND_DN', 'Service Account DN', 'CN=svc_crm,OU=Service,DC=corp,DC=local'],
            ['LDAP_BIND_PASSWORD', 'Пароль сервис-аккаунта', '••••••••'],
            ['LDAP_SEARCH_BASE', 'Base DN поиска', 'DC=corp,DC=local'],
            ['LDAP_USER_FILTER', 'Фильтр пользователей', currentPreset?.user_filter || ''],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type={key.includes('PASSWORD') ? 'password' : 'text'} placeholder={placeholder}
                className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">💾 Сохранить</button>
          <button onClick={handleTest} disabled={testing}
            className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
            {testing ? '🔄 Тестирование...' : '🔌 Тест подключения'}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={"rounded-xl p-4 border " + (testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30')}>
          {testResult.ok ? (
            <div className="flex items-center gap-2"><span className="text-lg">✅</span><span className="text-sm font-medium text-emerald-400">Подключение успешно</span></div>
          ) : (
            <div className="flex items-center gap-2"><span className="text-lg">❌</span><span className="text-sm font-medium text-red-400">Ошибка: {testResult.error}</span></div>
          )}
        </div>
      )}
    </div>
  )
}

// ── OIDC Tab ──────────────────────────────────────────────────

function OidcTab() {
  const [status, setStatus] = useState<any>(null)
  const [presets, setPresets] = useState<Record<string, any>>({})
  const [selectedPreset, setSelectedPreset] = useState('keycloak')
  const [discoverResult, setDiscoverResult] = useState<any>(null)
  const [discovering, setDiscovering] = useState(false)

  useEffect(() => {
    fetch('/api/v1/integrations/oidc/status').then(r => r.json()).then(setStatus).catch(() => {})
    Promise.all([
      fetch('/api/v1/integrations/oidc/presets/keycloak').then(r => r.json()),
      fetch('/api/v1/integrations/oidc/presets/azuread').then(r => r.json()),
    ]).then(([kc, az]) => setPresets({ keycloak: kc, azuread: az })).catch(() => {})
  }, [])

  const handleDiscover = async () => {
    setDiscovering(true); setDiscoverResult(null)
    try {
      const r = await fetch('/api/v1/integrations/oidc/discover?issuer_url=https://keycloak.corp.local/realms/myrealm', { method: 'POST' })
      setDiscoverResult(await r.json())
    } catch (e: any) { setDiscoverResult({ ok: false, error: e.message }) }
    setDiscovering(false)
  }

  const currentPreset = presets[selectedPreset]

  return (
    <div className="space-y-5">
      {/* Status */}
      {status && (
        <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className={"w-3 h-3 rounded-full " + (status.enabled ? 'bg-emerald-500' : 'bg-gray-600')} />
            <h2 className="text-base font-semibold">OIDC / Keycloak</h2>
            <span className={"text-xs px-2 py-0.5 rounded-full " + (status.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-500')}>
              {status.enabled ? 'Включён' : 'Отключён'}
            </span>
          </div>
          {status.issuer && <div className="text-xs text-gray-500 mt-2">{status.provider}: {status.issuer}</div>}
        </div>
      )}

      {/* Preset selector */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Поддерживаемые провайдеры</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(presets).map(([key, p]: [string, any]) => (
            <button key={key} onClick={() => setSelectedPreset(key)}
              className={"p-3 rounded-lg border text-left transition-colors " + (selectedPreset === key ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#15102E] border-[#312E81] hover:border-[#4338CA]')}>
              <div className="text-sm font-medium">{p?.name}</div>
            </button>
          ))}
        </div>
        {currentPreset && <p className="text-sm text-gray-400">{currentPreset.description}</p>}
      </div>

      {/* Configuration form */}
      <div className="bg-[#1E1B4B] border border-[#312E81] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Параметры OIDC</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['OIDC_ISSUER', 'Issuer URL (Realm)', 'https://keycloak.corp.local/realms/myrealm'],
            ['OIDC_CLIENT_ID', 'Client ID', 'crm-system'],
            ['OIDC_CLIENT_SECRET', 'Client Secret', '••••••••'],
            ['OIDC_SCOPES', 'Scopes', 'openid profile email'],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type={key.includes('SECRET') ? 'password' : 'text'} placeholder={placeholder}
                className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
        </div>
        {/* Role mapping */}
        <div className="mt-4">
          <label className="text-xs text-gray-500 block mb-1">Role mapping (через запятую)</label>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="admin roles: crm-admin, admin"
              className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input placeholder="user roles: crm-user, user"
              className="w-full bg-[#2D2A6E] border border-[#312E81] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">💾 Сохранить</button>
          <button onClick={handleDiscover} disabled={discovering}
            className="bg-[#2D2A6E] hover:bg-[#363278] text-gray-300 text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
            {discovering ? '🔄 Discovery...' : '🔍 Auto-Discover'}
          </button>
          <a href="/api/v1/integrations/oidc/login" target="_blank"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
            🔑 Тест входа Keycloak
          </a>
        </div>
      </div>

      {/* Discover result */}
      {discoverResult && (
        <div className={"rounded-xl p-4 border " + (discoverResult.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30')}>
          {discoverResult.ok ? (
            <div>
              <div className="flex items-center gap-2 mb-3"><span className="text-lg">✅</span><span className="text-sm font-medium text-emerald-400">Endpoints обнаружены</span></div>
              <div className="space-y-1 text-xs">
                {discoverResult.authorization_endpoint && <div><span className="text-gray-500">authorization:</span> <code className="text-indigo-400 break-all">{discoverResult.authorization_endpoint}</code></div>}
                {discoverResult.token_endpoint && <div><span className="text-gray-500">token:</span> <code className="text-indigo-400 break-all">{discoverResult.token_endpoint}</code></div>}
                {discoverResult.userinfo_endpoint && <div><span className="text-gray-500">userinfo:</span> <code className="text-indigo-400 break-all">{discoverResult.userinfo_endpoint}</code></div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2"><span className="text-lg">❌</span><span className="text-sm font-medium text-red-400">Ошибка: {discoverResult.error}</span></div>
          )}
        </div>
      )}
    </div>
  )
}
