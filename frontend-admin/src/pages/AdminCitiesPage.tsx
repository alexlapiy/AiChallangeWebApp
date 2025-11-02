import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trash2, MapPin } from 'lucide-react'
import { api } from '../shared/api'
import { useState } from 'react'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'

export default function AdminCitiesPage() {
  const { data: cities = [], refetch } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)

  const fetchCoordinates = async () => {
    if (!name.trim()) return
    
    setIsGeocoding(true)
    try {
      // Используем Nominatim API от OpenStreetMap (бесплатный, без ключа)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&accept-language=ru`,
        {
          headers: {
            'User-Agent': 'ShipmentApp/1.0' // Nominatim требует User-Agent
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat).toFixed(4))
        setLongitude(parseFloat(data[0].lon).toFixed(4))
      } else {
        alert('Координаты не найдены. Попробуйте уточнить название города.')
      }
    } catch (error) {
      console.error('Ошибка геокодинга:', error)
      alert('Не удалось получить координаты. Проверьте подключение к интернету.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const addCity = useMutation({
    mutationFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Координаты обязательны для заполнения')
      }
      return api.createCity({ 
        name, 
        is_active: true,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      })
    },
    onSuccess: () => { 
      setName(''); 
      setLatitude('');
      setLongitude('');
      refetch() 
    },
    onError: (error: Error) => {
      alert(error.message || 'Ошибка при создании города')
    },
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

  const updateCityCoordinates = useMutation({
    mutationFn: async ({ cityId, cityName }: { cityId: number; cityName: string }) => {
      // Получаем координаты через Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&accept-language=ru`,
        {
          headers: {
            'User-Agent': 'ShipmentApp/1.0'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        
        // Обновляем город
        return api.updateCity(cityId, { 
          latitude: lat, 
          longitude: lon 
        })
      } else {
        throw new Error('Координаты не найдены')
      }
    },
    onSuccess: () => refetch(),
    onError: () => alert('Не удалось получить координаты. Попробуйте указать их вручную.'),
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
          
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white mb-2">
                  Название города <span className="text-red-400">*</span>
                </Label>
                <Input 
                  placeholder="Москва" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      fetchCoordinates()
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label className="text-white mb-2">
                  Широта (latitude) <span className="text-red-400">*</span>
                </Label>
                <Input 
                  placeholder="55.7558" 
                  value={latitude} 
                  onChange={e => setLatitude(e.target.value)}
                  className={`bg-white/10 text-white ${
                    !latitude && name ? 'border-red-400/60' : 'border-white/20'
                  }`}
                  type="number"
                  step="0.0001"
                  required
                />
                {!latitude && name && (
                  <p className="text-red-400/80 text-xs mt-1">Обязательное поле</p>
                )}
              </div>
              <div>
                <Label className="text-white mb-2">
                  Долгота (longitude) <span className="text-red-400">*</span>
                </Label>
                <Input 
                  placeholder="37.6173" 
                  value={longitude} 
                  onChange={e => setLongitude(e.target.value)}
                  className={`bg-white/10 text-white ${
                    !longitude && name ? 'border-red-400/60' : 'border-white/20'
                  }`}
                  type="number"
                  step="0.0001"
                  required
                />
                {!longitude && name && (
                  <p className="text-red-400/80 text-xs mt-1">Обязательное поле</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Button 
                onClick={fetchCoordinates}
                disabled={!name || isGeocoding}
                className={`border ${
                  !name || isGeocoding 
                    ? 'bg-white/10 border-white/30 text-white/50 cursor-not-allowed' 
                    : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                }`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGeocoding ? 'Поиск...' : 'Получить координаты'}
              </Button>
              <Button 
                onClick={() => addCity.mutate()} 
                disabled={!name || !latitude || !longitude || addCity.isPending}
                className={`${
                  !name || !latitude || !longitude || addCity.isPending
                    ? 'bg-white/50 text-black/50 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {addCity.isPending ? 'Добавление...' : 'Добавить город'}
              </Button>
              <div className="text-white/60 text-sm">
                💡 Координаты обязательны. Нажмите "Получить координаты" или введите вручную
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {(cities as any[]).map(c => (
              <div 
                key={c.id} 
                className="bg-white/10 border border-white/20 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-white font-medium">{c.name}</span>
                    {(c.latitude && c.longitude) ? (
                      <div className="text-white/60 text-sm mt-1">
                        📍 {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                      </div>
                    ) : (
                      <div className="text-yellow-400/80 text-sm mt-1">
                        ⚠️ Координаты не указаны
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(!c.latitude || !c.longitude) && (
                      <Button
                        size="sm"
                        onClick={() => updateCityCoordinates.mutate({ cityId: c.id, cityName: c.name })}
                        disabled={updateCityCoordinates.isPending}
                        className={`${
                          updateCityCoordinates.isPending
                            ? 'bg-blue-400/20 border border-blue-400/30 text-blue-300/50 cursor-not-allowed'
                            : 'bg-blue-400/30 border border-blue-400/50 text-blue-100 hover:bg-blue-400/40'
                        }`}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {updateCityCoordinates.isPending ? 'Получение...' : 'Получить координаты'}
                      </Button>
                    )}
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
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

