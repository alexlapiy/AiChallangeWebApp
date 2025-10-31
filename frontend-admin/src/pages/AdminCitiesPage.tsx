import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../shared/api'
import { useState } from 'react'

export default function AdminCitiesPage() {
  const { data: cities = [], refetch } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })
  const [name, setName] = useState('')

  const addCity = useMutation({
    mutationFn: async () => api.createCity({ name, is_active: true }),
    onSuccess: () => { setName(''); refetch() },
  })

  return (
    <div>
      <h2>Города</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Название города" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => addCity.mutate()} disabled={!name}>Добавить</button>
      </div>
      <ul>
        {(cities as any[]).map(c => (
          <li key={c.id}>{c.name} {c.is_active ? '' : '(неактивен)'}</li>
        ))}
      </ul>
    </div>
  )
}

