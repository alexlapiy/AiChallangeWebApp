import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '../shared/api'
import { useState } from 'react'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

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
    <div className="min-h-screen bg-black p-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-white text-3xl font-bold mb-6">Тарифы по месяцам</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div>
              <Label className="text-white mb-2">Месяц</Label>
              <Input 
                type="number" 
                min={1} 
                max={12} 
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2">≤1000 км (₽/км)</Label>
              <Input 
                type="number" 
                min={0} 
                value={le1000} 
                onChange={e => setLe1000(Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2">&gt;1000 км (₽/км)</Label>
              <Input 
                type="number" 
                min={0} 
                value={gt1000} 
                onChange={e => setGt1000(Number(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => createTariff.mutate()}
                disabled={createTariff.isPending}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {createTariff.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white/80 font-medium">Месяц</th>
                  <th className="text-left py-3 px-4 text-white/80 font-medium">≤1000 км</th>
                  <th className="text-left py-3 px-4 text-white/80 font-medium">&gt;1000 км</th>
                </tr>
              </thead>
              <tbody>
                {(tariffs as any[]).map((t: any) => (
                  <tr key={t.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">{MONTHS[t.month - 1]}</td>
                    <td className="py-4 px-4 text-white">{t.price_per_km_le_1000} ₽</td>
                    <td className="py-4 px-4 text-white">{t.price_per_km_gt_1000} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

