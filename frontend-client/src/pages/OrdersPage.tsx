import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Truck, ArrowLeft, Check } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { api } from '../shared/api'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const [dateD, setDateD] = useState<string>(new Date().toISOString().slice(0, 10))
  const [orderByCost, setOrderByCost] = useState(false)

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })

  const cityIdToName = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of cities as any[]) m.set(c.id, c.name)
    return m
  }, [cities])

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (orderByCost) p.set('order_by_cost', 'true')
    return p
  }, [orderByCost])

  const { data: orders = [], refetch } = useQuery({
    queryKey: ['orders', params.toString()],
    queryFn: () => api.listOrders(params) as any,
  })

  const pay = useMutation({ 
    mutationFn: (id: number) => api.payOrder(id) as any, 
    onSuccess: () => {
      refetch()
      toast.success('Оплата прошла успешно!')
    }
  })

  function rowColor(o: Order): string {
    const D = new Date(dateD)
    const start = new Date(o.start_date)
    const eta = new Date(o.eta_date)
    if (D < start) return '#e8ffe8'
    if (D >= start && D < eta) return '#fff8e0'
    return '#e8efff'
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Назад
              </Button>
              <div className="bg-white p-2 rounded-xl">
                <Truck className="h-6 w-6 text-black" />
              </div>
              <span className="text-white tracking-wider">КИБЕРТРАКС</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-white mb-6 text-3xl font-bold">Реестр заказов</h2>
            
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <div>
                <label className="text-white/80 text-sm mr-2">Дата D:</label>
                <input 
                  type="date" 
                  value={dateD} 
                  onChange={e => setDateD(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={orderByCost} 
                  onChange={e => setOrderByCost(e.target.checked)}
                  className="w-4 h-4"
                />
                сортировать по стоимости
              </label>
              <Button 
                onClick={() => refetch()}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black"
              >
                Обновить
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/80 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Откуда</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Куда</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Старт</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">ETA</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Стоимость</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Статус оплаты</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(orders as Order[]).map(o => (
                    <tr 
                      key={o.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      style={{ background: rowColor(o) }}
                    >
                      <td className="py-4 px-4 text-white">{o.id}</td>
                      <td className="py-4 px-4 text-white">{cityIdToName.get(o.from_city_id) || '-'}</td>
                      <td className="py-4 px-4 text-white">{cityIdToName.get(o.to_city_id) || '-'}</td>
                      <td className="py-4 px-4 text-white">{o.start_date}</td>
                      <td className="py-4 px-4 text-white">{o.eta_date}</td>
                      <td className="py-4 px-4 text-white">{o.transport_price.toLocaleString('ru-RU')} ₽</td>
                      <td className="py-4 px-4">
                        {o.payment_status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <Check className="h-4 w-4" />
                            Оплачено
                          </span>
                        ) : (
                          <span className="text-yellow-400">{o.payment_status}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {o.payment_status !== 'PAID' && (
                          <Button
                            onClick={() => pay.mutate(o.id)}
                            disabled={pay.isPending}
                            size="sm"
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            {pay.isPending ? 'Оплата...' : 'Оплатить'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  Заказов пока нет
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
