import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../shared/api'
import { useState } from 'react'

export default function AdminTariffsPage() {
  const { data: tariffs = [], refetch } = useQuery({ queryKey: ['tariffs'], queryFn: api.listTariffs as any })
  const [month, setMonth] = useState(1)
  const [le1000, setLe1000] = useState(150)
  const [gt1000, setGt1000] = useState(100)

  const createTariff = useMutation({
    mutationFn: async () => api.createTariff({ month, price_per_km_le_1000: le1000, price_per_km_gt_1000: gt1000 }),
    onSuccess: () => refetch(),
  })

  return (
    <div>
      <h2>Тарифы по месяцам</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} />
        <input type="number" min={0} value={le1000} onChange={e => setLe1000(Number(e.target.value))} />
        <input type="number" min={0} value={gt1000} onChange={e => setGt1000(Number(e.target.value))} />
        <button onClick={() => createTariff.mutate()}>Добавить/Обновить</button>
      </div>

      <table cellPadding={8}>
        <thead>
          <tr>
            <th>Месяц</th>
            <th>≤1000 км</th>
            <th>&gt;1000 км</th>
          </tr>
        </thead>
        <tbody>
          {(tariffs as any[]).map(t => (
            <tr key={t.id}>
              <td>{t.month}</td>
              <td>{t.price_per_km_le_1000}</td>
              <td>{t.price_per_km_gt_1000}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

