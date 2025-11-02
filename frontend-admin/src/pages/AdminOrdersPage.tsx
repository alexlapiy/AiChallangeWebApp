import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { api } from '../shared/api'

type Order = {
  id: number
  created_at: string
  user_full_name: string
  user_phone: string
  car_brand_model: string
  from_city_id: number
  to_city_id: number
  start_date: string
  eta_date: string
  distance_km: number
  applied_price_per_km: number | null
  is_fixed_route: boolean
  transport_price: number
  insurance_price: number
  duration_days: number
  duration_hours_remainder: number
  payment_status: 'PENDING' | 'PAID' | 'MANUAL'
}

type PaginatedResponse = {
  items: Order[]
  total: number
  page: number
  limit: number
  pages: number
}

export default function AdminOrdersPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startFrom, setStartFrom] = useState('')
  const [startTo, setStartTo] = useState('')
  const [fromCityId, setFromCityId] = useState('all')
  const [toCityId, setToCityId] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'created' | 'start' | 'eta' | 'cost'>('start')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: cities = [] } = useQuery({ 
    queryKey: ['cities'], 
    queryFn: api.listCities as any 
  })

  const cityIdToName = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of cities as any[]) m.set(c.id, c.name)
    return m
  }, [cities])

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (startFrom) p.set('start_from', startFrom)
    if (startTo) p.set('start_to', startTo)
    if (fromCityId && fromCityId !== 'all') p.set('from_city_id', fromCityId)
    if (toCityId && toCityId !== 'all') p.set('to_city_id', toCityId)
    if (paymentStatus && paymentStatus !== 'all') p.set('payment_status', paymentStatus)
    if (sortBy === 'cost') p.set('order_by_cost', 'true')
    p.set('page', page.toString())
    p.set('limit', '20')
    return p
  }, [startFrom, startTo, fromCityId, toCityId, paymentStatus, sortBy, page])

  const { data, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['orders', params.toString()],
    queryFn: () => api.listAllOrders(params),
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.updatePaymentStatus(orderId, status),
    onSuccess: () => refetch(),
  })

  const removeOrder = useMutation({
    mutationFn: async (orderId: number) => api.deleteOrder(orderId),
    onSuccess: () => refetch(),
  })

  const handleReset = () => {
    setStartFrom('')
    setStartTo('')
    setFromCityId('all')
    setToCityId('all')
    setPaymentStatus('all')
    setPage(1)
  }

  const getRowColor = (order: Order) => {
    const selected = new Date(selectedDate)
    const start = new Date(order.start_date)
    const eta = new Date(order.eta_date)

    if (start > selected) return 'bg-green-500/20 hover:bg-green-500/30'
    if (start <= selected && eta > selected) return 'bg-yellow-500/20 hover:bg-yellow-500/30'
    return 'bg-blue-500/20 hover:bg-blue-500/30'
  }

  const orders = useMemo(() => {
    if (!data) return []
    const list = [...data.items]
    
    if (sortBy === 'created') {
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'start') {
      return list.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    } else if (sortBy === 'eta') {
      return list.sort((a, b) => new Date(a.eta_date).getTime() - new Date(b.eta_date).getTime())
    }
    
    return list
  }, [data, sortBy])

  return (
    <>
      <section className="pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-white text-3xl font-bold mb-6">Реестр заказов</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label className="text-white mb-2">Выбранная дата (для индикации)</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white mb-2">Старт от</Label>
                <Input
                  type="date"
                  value={startFrom}
                  onChange={(e) => { setStartFrom(e.target.value); setPage(1) }}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white mb-2">Старт до</Label>
                <Input
                  type="date"
                  value={startTo}
                  onChange={(e) => { setStartTo(e.target.value); setPage(1) }}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white mb-2">Откуда</Label>
                <Select value={fromCityId} onValueChange={(v) => { setFromCityId(v); setPage(1) }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="all">Все города</SelectItem>
                    {(cities as any[]).map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white mb-2">Куда</Label>
                <Select value={toCityId} onValueChange={(v) => { setToCityId(v); setPage(1) }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="all">Все города</SelectItem>
                    {(cities as any[]).map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white mb-2">Статус оплаты</Label>
                <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1) }}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="PENDING">Ожидает оплаты</SelectItem>
                    <SelectItem value="PAID">Оплачено</SelectItem>
                    <SelectItem value="MANUAL">Ручная оплата</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white mb-2">Сортировка</Label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="created">По дате создания</SelectItem>
                    <SelectItem value="start">По дате старта</SelectItem>
                    <SelectItem value="eta">По дате прибытия</SelectItem>
                    <SelectItem value="cost">По стоимости</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Сбросить фильтры
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 rounded"></div>
                <span className="text-white/60">Не уехал</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/40 rounded"></div>
                <span className="text-white/60">В пути</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/40 rounded"></div>
                <span className="text-white/60">Доставлен</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/80 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">ФИО</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Телефон</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Авто</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Откуда</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Куда</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Старт</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">ETA</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Стоимость</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Оплата</th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const totalPrice = o.transport_price + o.insurance_price
                    return (
                      <tr 
                        key={o.id} 
                        className={`border-b border-white/10 transition-colors cursor-pointer ${getRowColor(o)}`}
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="py-4 px-4 text-white">{o.id}</td>
                        <td className="py-4 px-4 text-white">{o.user_full_name}</td>
                        <td className="py-4 px-4 text-white">{o.user_phone}</td>
                        <td className="py-4 px-4 text-white">{o.car_brand_model}</td>
                        <td className="py-4 px-4 text-white">{cityIdToName.get(o.from_city_id) || '-'}</td>
                        <td className="py-4 px-4 text-white">{cityIdToName.get(o.to_city_id) || '-'}</td>
                        <td className="py-4 px-4 text-white">{new Date(o.start_date).toLocaleDateString('ru-RU')}</td>
                        <td className="py-4 px-4 text-white">{new Date(o.eta_date).toLocaleDateString('ru-RU')}</td>
                        <td className="py-4 px-4 text-white">{totalPrice.toLocaleString('ru-RU')} ₽</td>
                        <td className="py-4 px-4">
                          {o.payment_status === 'PAID' && <span className="text-green-400">Оплачено</span>}
                          {o.payment_status === 'PENDING' && <span className="text-yellow-400">Ожидает</span>}
                          {o.payment_status === 'MANUAL' && <span className="text-blue-400">Ручная</span>}
                        </td>
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={o.payment_status} 
                              onValueChange={(v) => updateStatus.mutate({ orderId: o.id, status: v })}
                            >
                              <SelectTrigger className="w-32 h-8 bg-white/10 border-white/20 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-white/20 text-white">
                                <SelectItem value="PENDING">Ожидает</SelectItem>
                                <SelectItem value="PAID">Оплачено</SelectItem>
                                <SelectItem value="MANUAL">Ручная</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrder.mutate(o.id)}
                              disabled={removeOrder.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  Заказов не найдено
                </div>
              )}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-white/60 text-sm">
                  Заказы {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} из {data.total}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Предыдущая
                  </Button>
                  
                  <div className="text-white/80 text-sm">
                    Страница {page} из {data.pages}
                  </div>
                  
                  <Button
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Следующая
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-black border-white/20 text-white max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Заказ #{selectedOrder.id}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60 mb-1">Дата создания</div>
                  <div>{new Date(selectedOrder.created_at).toLocaleString('ru-RU')}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">ФИО клиента</div>
                  <div>{selectedOrder.user_full_name}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Телефон</div>
                  <div>{selectedOrder.user_phone}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Марка автомобиля</div>
                  <div>{selectedOrder.car_brand_model}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Маршрут</div>
                  <div>{cityIdToName.get(selectedOrder.from_city_id)} → {cityIdToName.get(selectedOrder.to_city_id)}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Расстояние</div>
                  <div>{selectedOrder.distance_km} км</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Тариф</div>
                  <div>{selectedOrder.is_fixed_route ? 'Фикс-маршрут' : `${selectedOrder.applied_price_per_km} ₽/км`}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Стоимость транспорта</div>
                  <div>{selectedOrder.transport_price.toLocaleString('ru-RU')} ₽</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Страховка</div>
                  <div>{selectedOrder.insurance_price.toLocaleString('ru-RU')} ₽</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Итого</div>
                  <div className="font-bold">{(selectedOrder.transport_price + selectedOrder.insurance_price).toLocaleString('ru-RU')} ₽</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Длительность</div>
                  <div>{selectedOrder.duration_days} дн. {selectedOrder.duration_hours_remainder} ч.</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Дата старта</div>
                  <div>{new Date(selectedOrder.start_date).toLocaleDateString('ru-RU')}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Дата прибытия</div>
                  <div>{new Date(selectedOrder.eta_date).toLocaleDateString('ru-RU')}</div>
                </div>
                
                <div>
                  <div className="text-white/60 mb-1">Статус оплаты</div>
                  <div>
                    {selectedOrder.payment_status === 'PAID' && <span className="text-green-400">Оплачено</span>}
                    {selectedOrder.payment_status === 'PENDING' && <span className="text-yellow-400">Ожидает оплаты</span>}
                    {selectedOrder.payment_status === 'MANUAL' && <span className="text-blue-400">Ручная оплата</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

