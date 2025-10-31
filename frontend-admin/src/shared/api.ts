export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ADMIN_AUTH = 'Basic ' + btoa('admin:admin')

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
  listCities: () => request('/api/v1/cities'),
  createCity: (body: { name: string; is_active: boolean }) =>
    request('/api/v1/cities', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
  listTariffs: () => request('/api/v1/tariffs'),
  createTariff: (body: { month: number; price_per_km_le_1000: number; price_per_km_gt_1000: number }) =>
    request('/api/v1/tariffs', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: ADMIN_AUTH } }),
}

