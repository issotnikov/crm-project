// API client with JWT auth

const API_URL = '/api/v1'

// ── Token management ──────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('crm_access_token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('crm_refresh_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('crm_access_token', access)
  localStorage.setItem('crm_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('crm_access_token')
  localStorage.removeItem('crm_refresh_token')
  localStorage.removeItem('crm_user')
}

export function getUser(): { name: string; email: string; role: string } | null {
  const raw = localStorage.getItem('crm_user')
  return raw ? JSON.parse(raw) : null
}

// ── Fetch with auth ───────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const resp = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (resp.status === 401) {
    // Try refresh
    const refresh = getRefreshToken()
    if (refresh && !path.includes('/auth/')) {
      try {
        const refreshResp = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        })
        if (refreshResp.ok) {
          const data = await refreshResp.json()
          localStorage.setItem('crm_access_token', data.access_token)
          // Retry original request
          headers['Authorization'] = `Bearer ${data.access_token}`
          const retry = await fetch(`${API_URL}${path}`, { ...options, headers })
          return retry.json()
        }
      } catch {
        // refresh failed
      }
    }
    clearTokens()
    window.location.reload()
    throw new Error('Unauthorized')
  }

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`)
  }

  return resp.json()
}

// ── API methods ───────────────────────────────────────────────
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Analytics
  getDashboard: () => apiFetch('/analytics/dashboard'),
  getFunnel: () => apiFetch('/funnel'.replace('/funnel', '/analytics/funnel')),

  // CRM
  getLeads: () => apiFetch('/crm/leads'),
  getDeals: () => apiFetch('/crm/deals'),
  getCustomers: () => apiFetch('/crm/customers'),

  // Tasks
  getTasks: () => apiFetch('/tasks/'),

  // Finance
  getInvoices: () => apiFetch('/finance/invoices'),
  getFinanceSummary: () => apiFetch('/finance/dashboard'),
}
