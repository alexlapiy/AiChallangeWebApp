import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
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

  const removeCity = useMutation({
    mutationFn: async (cityId: number) => api.deleteCity(cityId),
    onSuccess: () => refetch(),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ cityId, isActive }: { cityId: number; isActive: boolean }) => 
      api.updateCity(cityId, { is_active: !isActive }),
    onSuccess: () => refetch(),
  })

  return (
    <div className="p-8">
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
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive.mutate({ cityId: c.id, isActive: c.is_active })}
                    disabled={toggleActive.isPending}
                    className={c.is_active 
                      ? 'text-green-400 border-green-400/50 hover:bg-green-500/10' 
                      : 'text-red-400 border-red-400/50 hover:bg-red-500/10'
                    }
                  >
                    {c.is_active ? 'Активен' : 'Неактивен'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCity.mutate(c.id)}
                    disabled={removeCity.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

