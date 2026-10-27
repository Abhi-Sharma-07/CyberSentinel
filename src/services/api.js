import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const API_ROOT = API_BASE.replace(/\/api\/v1\/?$/, '')

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT ───────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: auto-refresh on 401 ─────────────
let _refreshing = false
let _refreshQueue = []

function _processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  _refreshQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    const isAuthUrl = original?.url?.includes('/auth/login') ||
                      original?.url?.includes('/auth/refresh') ||
                      original?.url?.includes('/auth/register')
    const is401 = err.response?.status === 401
    const isNotAuth = err.response?.status === 403 &&
                      err.response?.data?.detail === 'Not authenticated'

    if ((is401 || isNotAuth) && !isAuthUrl && !original._retried) {
      original._retried = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        if (!window.location.pathname.includes('/login')) window.location.href = '/login'
        return Promise.reject(err)
      }

      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(() => Promise.reject(err))
      }

      _refreshing = true
      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
        const newToken = res.data.access_token
        localStorage.setItem('access_token', newToken)
        localStorage.setItem('refresh_token', res.data.refresh_token)
        original.headers.Authorization = `Bearer ${newToken}`
        _processQueue(null, newToken)
        return api(original)
      } catch (refreshErr) {
        _processQueue(refreshErr)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        if (!window.location.pathname.includes('/login')) window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        _refreshing = false
      }

    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (u, p) => api.post('/auth/login', { username: u, password: p }),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  refresh: (token) => api.post('/auth/refresh', { refresh_token: token }),
  logout: () => api.post('/auth/logout').catch(() => {}), // best-effort
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, new_password) => api.post('/auth/reset-password', { email, otp, new_password }),
  listUsers: () => api.get('/auth/users'),
  updateUserRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
  updateUserStatus: (id, is_active) => api.patch(`/auth/users/${id}/status`, { is_active }),
}

// ── Security Events ───────────────────────────────────────
export const eventsApi = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  stats: () => api.get('/events/stats/summary'),
  simulate: (scenario = 'brute_force') =>
    api.post('/events/simulate', null, { params: { scenario } }),
}

// ── Risks ─────────────────────────────────────────────────
export const risksApi = {
  list: (params) => api.get('/risks', { params }),
  get: (id) => api.get(`/risks/${id}`),
  create: (data) => api.post('/risks', data),
  update: (id, data) => api.patch(`/risks/${id}`, data),
  delete: (id) => api.delete(`/risks/${id}`),
}

// ── Controls ──────────────────────────────────────────────
export const controlsApi = {
  list: (params) => api.get('/controls', { params }),
  get: (id) => api.get(`/controls/${id}`),
  create: (data) => api.post('/controls', data),
  update: (id, data) => api.patch(`/controls/${id}`, data),
}

// ── Incidents ─────────────────────────────────────────────
export const incidentsApi = {
  list: (params) => api.get('/incidents', { params }),
  get: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.patch(`/incidents/${id}`, data),
}

// ── Privacy ───────────────────────────────────────────────
export const privacyApi = {
  listInventory: (p) => api.get('/privacy/inventory', { params: p }),
  createInventory: (d) => api.post('/privacy/inventory', d),
  listAssessments: (p) => api.get('/privacy/assessments', { params: p }),
  createAssessment: (d) => api.post('/privacy/assessments', d),
  updateAssessment: (id, d) => api.patch(`/privacy/assessments/${id}`, d),
}

// ── Compliance ────────────────────────────────────────────
export const complianceApi = {
  list: (params) => api.get('/compliance', { params }),
  create: (d) => api.post('/compliance', d),
  update: (id, d) => api.patch(`/compliance/${id}`, d),
}

// ── Evidence ──────────────────────────────────────────────
export const evidenceApi = {
  list: (params) => api.get('/evidence', { params }),
  create: (d) => api.post('/evidence', d),
  review: (id, status) => api.patch(`/evidence/${id}/review`, null, { params: { status } }),
}

// ── AI ────────────────────────────────────────────────────
export const aiApi = {
  analyzeEvent: (desc) => api.post('/ai/analyze-event', { event_description: desc }),
  complianceMapping: (finding) => api.post('/ai/compliance-mapping', { finding }),
  executiveSummary: () => api.get('/ai/executive-summary'),
  recommendControls: (threat, asset) =>
    api.post('/ai/recommend-controls', null, { params: { threat_type: threat, asset } }),
  summarizeIncident: (id) => api.post(`/ai/summarize-incident/${id}`),
}

// ── Reports ───────────────────────────────────────────────
export const reportsApi = {
  downloadEvents: () => api.get('/reports/security-events.csv', { responseType: 'blob' }),
  downloadRisks: () => api.get('/reports/risk-register.csv', { responseType: 'blob' }),
  downloadCompliance: () => api.get('/reports/compliance-gaps.csv', { responseType: 'blob' }),
  downloadIncidents: () => api.get('/reports/incidents.csv', { responseType: 'blob' }),
  downloadPrivacy: () => api.get('/reports/privacy-assessment.csv', { responseType: 'blob' }),
}

// ── Threat Intel & Integrations ───────────────────────────
export const threatIntelApi = {
  getStatus: () => api.get('/threat-intel/status'),
  lookupIp: (ip) => api.post('/threat-intel/ip-lookup', { ip }),
  lookupHash: (hash) => api.post('/threat-intel/hash-lookup', { hash }),
  testWebhook: (data) => api.post('/threat-intel/test-webhook', data),
}

// ── ML ────────────────────────────────────────────────────
export const mlApi = {
  status: () => api.get('/ml/status'),
  train: () => api.post('/ml/train'),
  predict: (data) => api.post('/ml/predict', data),
}

// ── Health / Keep-Alive ───────────────────────────────────
export const healthApi = {
  check: () => axios.get(API_ROOT ? `${API_ROOT}/health` : '/health', {
    headers: { 'Cache-Control': 'no-cache' },
    timeout: 8000,
  }),
}
