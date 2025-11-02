import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Truck, ArrowLeft, Check } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { PaymentDialog } from '../shared/ui/PaymentDialog'
import { api } from '../shared/api'
import { useNavigate } from 'react-router-dom'

type Order = {
  id: number
  created_at: string
  start_date: string
  eta_date: string
  transport_price: number
  insurance_price: number
  payment_status: 'PENDING' | 'PAID' | 'MANUAL'
  from_city_id: number
  to_city_id: number
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<'created' | 'eta' | 'price'>('created')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })

  const cityIdToName = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of cities as any[]) m.set(c.id, c.name)
    return m
  }, [cities])

  useEffect(() => {
    const savedUser = localStorage.getItem('cybertrax_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUserId(user.id)
        setUserName(user.fullName || '')
      } catch {}
    }
  }, [])

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (currentUserId) p.set('user_id', currentUserId.toString())
    p.set('limit', '100')
    return p
  }, [currentUserId])

  const { data, refetch } = useQuery({
    queryKey: ['orders', params.toString()],
    queryFn: () => api.listOrders(params) as any,
  })

  const orders = useMemo(() => {
    const rawOrders = data?.items || []
    const list = [...rawOrders]
    if (sortBy === 'created') {
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'eta') {
      return list.sort((a, b) => new Date(a.eta_date).getTime() - new Date(b.eta_date).getTime())
    } else if (sortBy === 'price') {
      return list.sort((a, b) => {
        const priceA = a.transport_price + a.insurance_price
        const priceB = b.transport_price + b.insurance_price
        return priceB - priceA
      })
    }
    return list
  }, [data, sortBy])

  const pay = useMutation({ 
    mutationFn: (id: number) => api.payOrder(id) as any, 
    onSuccess: () => {
      refetch()
      setIsPaymentDialogOpen(false)
      setSelectedOrder(null)
      toast.success('Оплата прошла успешно!')
    }
  })

  const handlePayClick = (order: Order) => {
    setSelectedOrder(order)
    setIsPaymentDialogOpen(true)
  }

  const handlePayConfirm = () => {
    if (selectedOrder) {
      pay.mutate(selectedOrder.id)
    }
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
            
            {userName && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white/80 text-sm"
              >
                <span className="text-white/60">Пользователь: </span>
                <span className="text-white font-medium">{userName}</span>
              </motion.div>
            )}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-3xl font-bold">Реестр заказов</h2>
              
              <div className="flex items-center gap-3">
                <label className="text-white/80 text-sm">Сортировать:</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    <SelectItem value="created">По дате создания</SelectItem>
                    <SelectItem value="eta">По дате прибытия</SelectItem>
                    <SelectItem value="price">По цене</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  {(orders as Order[]).map(o => {
                    const totalPrice = o.transport_price + o.insurance_price
                    return (
                      <tr 
                        key={o.id} 
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4 text-white">{o.id}</td>
                        <td className="py-4 px-4 text-white">{cityIdToName.get(o.from_city_id) || '-'}</td>
                        <td className="py-4 px-4 text-white">{cityIdToName.get(o.to_city_id) || '-'}</td>
                        <td className="py-4 px-4 text-white">{new Date(o.start_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td className="py-4 px-4 text-white">{new Date(o.eta_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td className="py-4 px-4 text-white">{totalPrice.toLocaleString('ru-RU')} ₽</td>
                        <td className="py-4 px-4">
                          {o.payment_status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-green-400">
                              <Check className="h-4 w-4" />
                              Оплачено
                            </span>
                          ) : o.payment_status === 'PENDING' ? (
                            <span className="text-yellow-400">Ожидает оплаты</span>
                          ) : (
                            <span className="text-blue-400">Ручная оплата</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {o.payment_status !== 'PAID' && (
                            <Button
                              onClick={() => handlePayClick(o)}
                              size="sm"
                              className="bg-white text-black hover:bg-gray-200"
                            >
                              Оплатить
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        transportPrice={selectedOrder?.transport_price || 0}
        insurancePrice={selectedOrder?.insurance_price || 0}
        onConfirm={handlePayConfirm}
        isPending={pay.isPending}
      />
    </div>
  )
}
