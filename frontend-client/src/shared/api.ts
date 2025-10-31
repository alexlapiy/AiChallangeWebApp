export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  createUser: (body: { full_name: string; phone: string }) =>
    request('/api/v1/users', { method: 'POST', body: JSON.stringify(body) }),
  listCities: () => request('/api/v1/cities'),
  previewOrder: (body: any) =>
    request('/api/v1/orders/preview', { method: 'POST', body: JSON.stringify(body) }),
  createOrder: (body: any) =>
    request('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) }),
  listOrders: (params: URLSearchParams) => request(`/api/v1/orders?${params.toString()}`),
  payOrder: (id: number) => request(`/api/v1/orders/${id}/pay`, { method: 'POST' }),
}

