// API 配置
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TOKEN = () => localStorage.getItem('vpn_token')
const AUTH = () => TOKEN() ? { Authorization: `Bearer ${TOKEN()}` } : {}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...AUTH(),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || '请求失败')
  return data
}

export const vpnApi = {
  // 公开
  status: () => api('/api/status'),
  plans: () => api('/api/plans'),
  nodes: () => api('/api/nodes'),
  downloads: () => api('/api/downloads'),
  register: (data) => api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => api('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // 用户
  me: () => api('/api/user/me'),
  orders: () => api('/api/user/orders'),
  createOrder: (data) => api('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  payQr: (orderId) => api(`/api/pay/${orderId}/qr`),
  mockPay: (orderId) => api(`/api/pay/${orderId}/mock-complete`, { method: 'POST' }),

  // 管理
  adminDashboard: () => api('/api/admin/dashboard'),
  adminUsers: () => api('/api/admin/users'),
  adminOrders: () => api('/api/admin/orders'),
  adminNodes: () => api('/api/admin/nodes'),
  adminPlans: () => api('/api/admin/plans'),
  addNode: (data) => api('/api/admin/nodes', { method: 'POST', body: JSON.stringify(data) }),
  deleteNode: (nid) => api(`/api/admin/nodes/${nid}`, { method: 'DELETE' }),
  setAdmin: (uid) => api(`/api/admin/users/${uid}/set-admin`, { method: 'POST' }),
  deleteUser: (uid) => api(`/api/admin/users/${uid}`, { method: 'DELETE' }),
  updateDownload: (data) => api('/api/admin/downloads', { method: 'POST', body: JSON.stringify(data) }),
}
