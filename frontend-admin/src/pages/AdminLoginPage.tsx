import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Truck, LogIn } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'
import { api } from '../shared/api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: async () => {
      const result = await api.adminLogin(login, password)
      return result
    },
    onSuccess: (data: { token: string; admin_id: number }) => {
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_id', String(data.admin_id))
      navigate('/orders')
    },
    onError: () => {
      setError('Неверный логин или пароль')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!login || !password) {
      setError('Заполните все поля')
      return
    }
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-3 rounded-xl mb-4">
              <Truck className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-white text-3xl font-bold">КИБЕРТРАКС</h1>
            <p className="text-white/60 text-sm mt-2">Панель администратора</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login" className="text-white mb-2">Логин</Label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="admin"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white mb-2">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={loginMutation.isPending}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 text-center text-white/40 text-xs">
            Для входа используйте учетные данные администратора
          </div>
        </div>
      </motion.div>
    </div>
  )
}

