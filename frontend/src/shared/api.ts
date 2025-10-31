export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
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
  createUser: (body: { full_name: string; phone: string }) =>
    request('/api/v1/users', { method: 'POST', body: JSON.stringify(body) }),
  listCities: () => request('/api/v1/cities'),
  createCity: (body: { name: string; is_active: boolean }) =>
    request('/api/v1/cities', { method: 'POST', body: JSON.stringify(body) }),
  listTariffs: () => request('/api/v1/tariffs'),
  createTariff: (body: { month: number; price_per_km_le_1000: number; price_per_km_gt_1000: number }) =>
    request('/api/v1/tariffs', { method: 'POST', body: JSON.stringify(body) }),
  previewOrder: (body: any) =>
    request('/api/v1/orders/preview', { method: 'POST', body: JSON.stringify(body) }),
  createOrder: (body: any) =>
    request('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) }),
  listOrders: (params: URLSearchParams) => request(`/api/v1/orders?${params.toString()}`),
  payOrder: (id: number) => request(`/api/v1/orders/${id}/pay`, { method: 'POST' }),
}


