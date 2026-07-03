// API client with JWT auth — uses /mock endpoints for demo data

const API_URL = '/api/v1'

export function getToken(): string | null { return localStorage.getItem('crm_access_token') }
export function getRefreshToken(): string | null { return localStorage.getItem('crm_refresh_token') }
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
export function setUser(user: any) { localStorage.setItem('crm_user', JSON.stringify(user)) }

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const resp = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (resp.status === 401) {
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
          headers['Authorization'] = `Bearer ${data.access_token}`
          const retry = await fetch(`${API_URL}${path}`, { ...options, headers })
          return retry.json()
        }
      } catch { /* refresh failed */ }
    }
    clearTokens()
    window.location.reload()
    throw new Error('Unauthorized')
  }

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: () => apiFetch('/auth/profile'),
  updateProfile: (data: any) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getUsers: () => apiFetch('/auth/users'),
  createUser: (data: any) => apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (email: string, data: any) => apiFetch(`/auth/users/${email}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers / Leads / Deals
  getCustomers: (search?: string) => apiFetch(`/mock/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCustomerDetail: (id: string) => apiFetch(`/mock/customers/${id}`),
  getLeads: (status?: string, source?: string) => apiFetch(`/mock/leads${status ? `?status=${status}` : ''}`),
  getLeadDetail: (id: string) => apiFetch(`/mock/leads/${id}`),
  getDeals: (status?: string) => apiFetch(`/mock/deals${status ? `?status=${status}` : ''}`),
  getDealDetail: (id: string) => apiFetch(`/mock/deals/${id}`),

  // Tasks
  getTasks: () => apiFetch('/mock/tasks/'),
  getTaskDetail: (id: string) => apiFetch(`/mock/tasks/${id}`),
  getReminders: () => apiFetch('/mock/tasks/reminders'),
  createTask: (data: any) => apiFetch('/mock/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => apiFetch(`/mock/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Calendar
  getEvents: (start?: string, end?: string) => apiFetch(`/mock/tasks/calendar/events${start ? `?start=${encodeURIComponent(start)}` : ''}${end ? `${start ? '&' : '?'}end=${encodeURIComponent(end)}` : ''}`),
  createEvent: (data: any) => apiFetch('/mock/tasks/calendar/events', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getDashboard: () => apiFetch('/analytics/dashboard'),

  // Finance
  getFinanceDashboard: () => apiFetch('/mock/finance/dashboard'),
  getInvoices: (status?: string) => apiFetch('/mock/finance/invoices' + (status ? '?status=' + status : '')),
  getInvoiceDetail: (id: string) => apiFetch('/mock/finance/invoices/' + id),
  registerPayment: (id: string, data: any) => apiFetch('/mock/finance/invoices/' + id + '/payments', { method: 'POST', body: JSON.stringify(data) }),
  createInvoice: (data: any) => apiFetch('/mock/finance/invoices', { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  getDocuments: (type?: string, status?: string) => apiFetch('/mock/documents/' + (type || status ? '?' + (type ? 'type=' + type : '') + (type && status ? '&' : '') + (status ? 'status=' + status : '') : '')),
  getDocumentDetail: (id: string) => apiFetch('/mock/documents/' + id),
  getTemplates: () => apiFetch('/mock/documents/templates'),
  generateDocument: (data: any) => apiFetch('/mock/documents/generate', { method: 'POST', body: JSON.stringify(data) }),
  sendDocument: (id: string) => apiFetch('/mock/documents/' + id + '/send', { method: 'POST' }),
}
