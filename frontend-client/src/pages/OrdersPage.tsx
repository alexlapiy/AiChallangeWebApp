import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../shared/api'

type Order = {
  id: number
  start_date: string
  eta_date: string
  transport_price: number
  payment_status: 'PENDING' | 'PAID' | 'MANUAL'
  from_city_id: number
  to_city_id: number
}

export default function OrdersPage() {
  const [dateD, setDateD] = useState<string>(new Date().toISOString().slice(0, 10))
  const [orderByCost, setOrderByCost] = useState(false)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (orderByCost) p.set('order_by_cost', 'true')
    return p
  }, [orderByCost])

  const { data: orders = [], refetch } = useQuery({
    queryKey: ['orders', params.toString()],
    queryFn: () => api.listOrders(params) as any,
  })

  const pay = useMutation({ mutationFn: (id: number) => api.payOrder(id) as any, onSuccess: () => refetch() })

  function rowColor(o: Order): string {
    const D = new Date(dateD)
    const start = new Date(o.start_date)
    const eta = new Date(o.eta_date)
    if (D < start) return '#e8ffe8' // green
    if (D >= start && D < eta) return '#fff8e0' // yellow
    return '#e8efff' // blue
  }

  return (
    <div>
      <h2>Реестр заказов</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label>
          Дата D: <input type="date" value={dateD} onChange={e => setDateD(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={orderByCost} onChange={e => setOrderByCost(e.target.checked)} /> сортировать по стоимости
        </label>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Старт</th>
            <th>ETA</th>
            <th>Стоимость</th>
            <th>Статус оплаты</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(orders as Order[]).map(o => (
            <tr key={o.id} style={{ background: rowColor(o) }}>
              <td>{o.id}</td>
              <td>{o.start_date}</td>
              <td>{o.eta_date}</td>
              <td>{o.transport_price} ₽</td>
              <td>{o.payment_status}</td>
              <td>
                {o.payment_status !== 'PAID' && (
                  <button onClick={() => pay.mutate(o.id)} disabled={pay.isPending}>Оплатить</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

