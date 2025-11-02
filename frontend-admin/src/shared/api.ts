export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ADMIN_AUTH = 'Basic ' + btoa('admin:admin')

const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function request(path: string, options: RequestInit = {}) {
  const mergedHeaders: HeadersInit = {
    ...(options.headers || {}),
  }
  if (!(mergedHeaders as any)['Content-Type']) {
    ;(mergedHeaders as any)['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
  })
  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json()
      message = data?.error || message
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  adminLogin: (login: string, password: string) =>
    request('/api/v1/auth/admin/login', { 
      method: 'POST', 
      body: JSON.stringify({ login, password }) 
    }),
  listCities: () => request('/api/v1/cities'),
  createCity: (body: { name: string; is_active: boolean; latitude: number; longitude: number }) =>
    request('/api/v1/cities', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
  updateCity: (cityId: number, body: { name?: string; is_active?: boolean; latitude?: number; longitude?: number }) =>
    request(`/api/v1/cities/${cityId}`, { method: 'PUT', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
  deleteCity: (cityId: number) =>
    request(`/api/v1/cities/${cityId}`, { method: 'DELETE', headers: { Authorization: ADMIN_AUTH } }),
  listTariffs: () => request('/api/v1/tariffs'),
  createTariff: (body: { month: number; price_per_km_le_1000: number; price_per_km_gt_1000: number }) =>
    request('/api/v1/tariffs', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
  updateTariff: (tariffId: number, body: { month?: number; price_per_km_le_1000?: number; price_per_km_gt_1000?: number }) =>
    request(`/api/v1/tariffs/${tariffId}`, { method: 'PUT', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
  listAllOrders: (params: URLSearchParams) =>
    request(`/api/v1/orders?${params.toString()}`),
  updatePaymentStatus: (orderId: number, status: string) =>
    request(`/api/v1/orders/${orderId}/payment-status?new_status=${status}`, { 
      method: 'PATCH', 
      headers: getAuthHeaders() 
    }),
  deleteOrder: (orderId: number) =>
    request(`/api/v1/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: ADMIN_AUTH } }),
}

