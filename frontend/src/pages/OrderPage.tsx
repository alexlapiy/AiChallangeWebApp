import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../shared/api'

export default function OrderPage() {
  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [brandModel, setBrandModel] = useState('')
  const [fromCityId, setFromCityId] = useState<number | undefined>(undefined)
  const [toCityId, setToCityId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState<string>('')

  const cityIdToName = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of cities as any[]) m.set(c.id, c.name)
    return m
  }, [cities])

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!fromCityId || !toCityId || !startDate) throw new Error('Заполните поля')
      return api.previewOrder({
        car_brand_model: brandModel,
        from_city: cityIdToName.get(fromCityId),
        to_city: cityIdToName.get(toCityId),
        start_date: startDate,
      })
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!fromCityId || !toCityId || !startDate) throw new Error('Заполните поля')
      const user = await api.createUser({ full_name: fullName, phone })
      return api.createOrder({
        user_id: user.id,
        car_brand_model: brandModel,
        from_city_id: fromCityId,
        to_city_id: toCityId,
        from_city: cityIdToName.get(fromCityId),
        to_city: cityIdToName.get(toCityId),
        start_date: startDate,
      })
    },
  })

  useEffect(() => {
    // Reset preview on changes
    previewMutation.reset()
  }, [brandModel, fromCityId, toCityId, startDate])

  return (
    <div>
      <h2>Оформление заявки</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder="ФИО" value={fullName} onChange={e => setFullName(e.target.value)} />
        <input placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)} />
        <input placeholder="Марка/Модель авто" value={brandModel} onChange={e => setBrandModel(e.target.value)} />
        <select value={fromCityId ?? ''} onChange={e => setFromCityId(Number(e.target.value))}>
          <option value="">Откуда</option>
          {(cities as any[]).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={toCityId ?? ''} onChange={e => setToCityId(Number(e.target.value))}>
          <option value="">Куда</option>
          {(cities as any[]).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>Предпросчёт</button>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Создать заказ</button>
        </div>

        {previewMutation.isError && <div style={{ color: 'red' }}>{(previewMutation.error as Error).message}</div>}
        {previewMutation.data && (
          <div style={{ border: '1px solid #ccc', padding: 8 }}>
            <div>Дистанция: {(previewMutation.data as any).distance_km} км</div>
            <div>Цена перевозки: {(previewMutation.data as any).transport_price} ₽</div>
            <div>Страховка (10%): {(previewMutation.data as any).insurance_price} ₽</div>
            <div>ETA: {(previewMutation.data as any).eta_date}</div>
          </div>
        )}

        {createMutation.data && (
          <div style={{ color: 'green' }}>Заказ создан: ID {(createMutation.data as any).id}</div>
        )}
      </div>
    </div>
  )
}


