import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '../shared/api'
import { useState } from 'react'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'

export default function AdminCitiesPage() {
  const { data: cities = [], refetch } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })
  const [name, setName] = useState('')

  const addCity = useMutation({
    mutationFn: async () => api.createCity({ name, is_active: true }),
    onSuccess: () => { setName(''); refetch() },
  })

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-white text-3xl font-bold mb-6">Управление городами</h2>
          
          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <Label className="text-white mb-2">Название города</Label>
              <Input 
                placeholder="Москва" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => addCity.mutate()} 
                disabled={!name || addCity.isPending}
                className="bg-white text-black hover:bg-gray-200"
              >
                {addCity.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            {(cities as any[]).map(c => (
              <div 
                key={c.id} 
                className="bg-white/10 border border-white/20 rounded-lg p-4 flex justify-between items-center"
              >
                <span className="text-white">{c.name}</span>
                <span className={c.is_active ? 'text-green-400' : 'text-red-400'}>
                  {c.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

