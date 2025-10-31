import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Truck, Shield, Clock, Award, MapPin, Phone, Mail, Menu, X, Check, ArrowRight } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { Input } from '../shared/ui/input'
import { Label } from '../shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { ImageWithFallback } from '../shared/ui/ImageWithFallback'
import { api } from '../shared/api'

const carList = [
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Porsche',
  'Range Rover',
  'Bentley',
  'Rolls-Royce',
  'Tesla',
  'Lamborghini',
  'Ferrari'
]

export default function OrderPage() {
  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: api.listCities as any })

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; phone: string; fullName: string } | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [fromCityId, setFromCityId] = useState<number | undefined>(undefined)
  const [toCityId, setToCityId] = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState<string>('')

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
        setIsLoggedIn(true)
        setCurrentUser(user)
        setFullName(user.fullName)
        setPhone(user.phone)
      } catch {}
    }
  }, [])

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!fromCityId || !toCityId || !startDate) throw new Error('Заполните все поля')
      return api.previewOrder({
        car_brand_model: `${carBrand} ${carModel}`.trim(),
        from_city: cityIdToName.get(fromCityId),
        to_city: cityIdToName.get(toCityId),
        start_date: startDate,
      })
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!fullName || !phone) throw new Error('Заполните все поля')
      return api.createUser({ full_name: fullName, phone })
    },
    onSuccess: (data: any) => {
      const user = { id: data.id, phone, fullName }
      localStorage.setItem('cybertrax_user', JSON.stringify(user))
      setIsLoggedIn(true)
      setCurrentUser(user)
      setIsAuthOpen(false)
      toast.success('Добро пожаловать!')
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!isLoggedIn || !currentUser) throw new Error('Войдите в систему')
      if (!fromCityId || !toCityId || !startDate || !carBrand || !carModel) throw new Error('Заполните все поля')
      return api.createOrder({
        user_id: currentUser.id,
        car_brand_model: `${carBrand} ${carModel}`.trim(),
        from_city_id: fromCityId,
        to_city_id: toCityId,
        from_city: cityIdToName.get(fromCityId),
        to_city: cityIdToName.get(toCityId),
        start_date: startDate,
      })
    },
    onSuccess: () => {
      setIsBookingOpen(false)
      setCarBrand('')
      setCarModel('')
      setFromCityId(undefined)
      setToCityId(undefined)
      setStartDate('')
      toast.success('Заказ создан! Перейдите к списку заказов')
    },
  })

  const handleLogout = () => {
    localStorage.removeItem('cybertrax_user')
    setIsLoggedIn(false)
    setCurrentUser(null)
    setFullName('')
    setPhone('')
    toast.success('Вы вышли из системы')
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  useEffect(() => {
    if (fromCityId && toCityId && startDate) {
      previewMutation.reset()
    }
  }, [carBrand, carModel, fromCityId, toCityId, startDate])

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
              <div className="bg-white p-2 rounded-xl">
                <Truck className="h-6 w-6 text-black" />
              </div>
              <span className="text-white tracking-wider">КИБЕРТРАКС</span>
            </motion.div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('benefits')} className="text-white/80 hover:text-white transition-colors">
                Преимущества
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-white/80 hover:text-white transition-colors">
                Как это работает
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-white/80 hover:text-white transition-colors">
                Контакты
              </button>
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => window.location.href = '/orders'}
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black transition-all"
                  >
                    Мои заказы
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black transition-all">
                    Выйти
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsAuthOpen(true)} className="bg-white text-black hover:bg-gray-200">
                  Войти
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 flex flex-col gap-4 pb-4"
            >
              <button onClick={() => scrollToSection('benefits')} className="text-white/80 hover:text-white transition-colors text-left">
                Преимущества
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-white/80 hover:text-white transition-colors text-left">
                Как это работает
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-white/80 hover:text-white transition-colors text-left">
                Контакты
              </button>
              {isLoggedIn ? (
                <>
                  <Button 
                    onClick={() => { window.location.href = '/orders'; setIsMenuOpen(false); }}
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black w-full transition-all"
                  >
                    Мои заказы
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black w-full transition-all">
                    Выйти
                  </Button>
                </>
              ) : (
                <Button onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }} className="bg-white text-black hover:bg-gray-200 w-full">
                  Войти
                </Button>
              )}
            </motion.nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1748798938603-4f28913bc8a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjB0cmFuc3BvcnR8ZW58MXx8fHwxNzYxODkwMzEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Luxury car transport"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="backdrop-blur-xl bg-black/40 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
                <h1 className="text-white mb-6 text-4xl md:text-5xl font-bold">
                  Безопасная перевозка люкс-автомобилей
                </h1>
                <p className="text-white/90 mb-8 text-lg">
                  Профессиональная транспортировка премиальных автомобилей закрытыми автовозами. 
                  Индивидуальный подход к каждому клиенту и гарантия сохранности вашего автомобиля.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    onClick={() => {
                      if (!isLoggedIn) {
                        setIsAuthOpen(true)
                        toast.error('Пожалуйста, войдите в систему')
                      } else {
                        setIsBookingOpen(true)
                      }
                    }}
                    size="lg"
                    className="bg-white text-black hover:bg-gray-200 shadow-xl"
                  >
                    Заказать перевозку
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={() => scrollToSection('contact')}
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-black transition-all"
                  >
                    Связаться с нами
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-black mb-4 text-3xl md:text-4xl font-bold">Почему выбирают нас</h2>
            <p className="text-black/60 max-w-2xl mx-auto">
              Мы предлагаем профессиональные услуги по перевозке люкс-автомобилей с гарантией безопасности
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Полная безопасность',
                description: 'Закрытые автовозы и страхование каждого автомобиля'
              },
              {
                icon: Truck,
                title: 'Индивидуальная перевозка',
                description: 'Один автомобиль в автовозе для максимальной защиты'
              },
              {
                icon: Clock,
                title: 'Точность сроков',
                description: 'Доставка в оговоренные сроки без задержек'
              },
              {
                icon: Award,
                title: 'Опыт и надежность',
                description: 'Работаем с премиальными автомобилями более 5 лет'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="backdrop-blur-xl bg-black/5 border border-black/10 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
              >
                <div className="bg-black w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-black mb-3 text-xl font-semibold">{benefit.title}</h3>
                <p className="text-black/60">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-white mb-4 text-3xl md:text-4xl font-bold">Как это работает</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Простой и понятный процесс заказа перевозки вашего автомобиля
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Регистрация',
                description: 'Создайте аккаунт, указав ФИО и телефон'
              },
              {
                step: '02',
                title: 'Заказ',
                description: 'Укажите детали автомобиля и маршрут'
              },
              {
                step: '03',
                title: 'Оплата',
                description: 'Оплатите заказ онлайн безопасно'
              },
              {
                step: '04',
                title: 'Перевозка',
                description: 'Мы доставим ваш автомобиль в срок'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 shadow-xl">
                  <div className="text-6xl text-white mb-4 opacity-20">
                    {step.step}
                  </div>
                  <h3 className="text-white mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="text-white/60">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-white mb-4 text-3xl md:text-4xl font-bold">Свяжитесь с нами</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Остались вопросы? Наши специалисты всегда готовы помочь
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl">
                  <Phone className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-white/60">Телефон</p>
                  <p className="text-white">+7 (999) 123-45-67</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl">
                  <Mail className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-white/60">Email</p>
                  <p className="text-white">info@cybertrax.ru</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="backdrop-blur-xl bg-white border-t border-black/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-black p-2 rounded-xl">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="text-black tracking-wider">КИБЕРТРАКС</span>
              </div>
              <p className="text-black/60">
                Профессиональная перевозка люкс-автомобилей по всей России
              </p>
            </div>
            <div>
              <h4 className="text-black mb-4 font-semibold">О компании</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">О нас</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">История</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Наша команда</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-black mb-4 font-semibold">Услуги</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Перевозка автомобилей</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Страхование</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Экспресс-доставка</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-black mb-4 font-semibold">Контакты</h4>
              <ul className="space-y-2">
                <li className="text-black/60">+7 (999) 123-45-67</li>
                <li className="text-black/60">info@cybertrax.ru</li>
                <li className="text-black/60">Москва, ул. Примерная, 123</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-black/10 pt-8 text-center">
            <p className="text-black/60">
              © 2025 ООО «КИБЕРТРАКС». Все права защищены.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="backdrop-blur-xl bg-black/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Регистрация</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="auth-name">ФИО</Label>
              <Input 
                id="auth-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label htmlFor="auth-phone">Телефон</Label>
              <Input 
                id="auth-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <Button 
              onClick={() => createUserMutation.mutate()}
              disabled={createUserMutation.isPending}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              {createUserMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            {createUserMutation.isError && (
              <p className="text-red-400 text-sm">{(createUserMutation.error as Error).message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="backdrop-blur-xl bg-black/95 border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Заказать перевозку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="car-brand">Марка автомобиля</Label>
                <Select value={carBrand} onValueChange={setCarBrand}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Выберите марку" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    {carList.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                    <SelectItem value="Другая">Другая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="car-model">Модель автомобиля</Label>
                <Input 
                  id="car-model"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="Введите модель"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-city">Город отправления</Label>
                <Select value={fromCityId?.toString() || ''} onValueChange={(value) => setFromCityId(Number(value))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    {(cities as any[]).map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to-city">Город назначения</Label>
                <Select value={toCityId?.toString() || ''} onValueChange={(value) => setToCityId(Number(value))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20 text-white">
                    {(cities as any[]).map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="date">Дата начала перевозки</Label>
              <Input 
                id="date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {previewMutation.data && (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/60">Дистанция:</p>
                <p className="text-white text-lg">{(previewMutation.data as any).distance_km} км</p>
                <p className="text-white/60 mt-2">Стоимость перевозки:</p>
                <p className="text-white text-lg">{(previewMutation.data as any).transport_price.toLocaleString('ru-RU')} ₽</p>
                <p className="text-white/60 mt-2">Страховка (10%):</p>
                <p className="text-white text-lg">{(previewMutation.data as any).insurance_price.toLocaleString('ru-RU')} ₽</p>
                <p className="text-white/60 mt-2">ETA:</p>
                <p className="text-white text-lg">{(previewMutation.data as any).eta_date}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending || !fromCityId || !toCityId || !startDate}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-black"
              >
                {previewMutation.isPending ? 'Расчёт...' : 'Предпросчёт'}
              </Button>
              <Button 
                onClick={() => createOrderMutation.mutate()}
                disabled={createOrderMutation.isPending || !previewMutation.data}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                {createOrderMutation.isPending ? 'Создание...' : 'Создать заказ'}
              </Button>
            </div>

            {previewMutation.isError && (
              <p className="text-red-400 text-sm">{(previewMutation.error as Error).message}</p>
            )}
            {createOrderMutation.isError && (
              <p className="text-red-400 text-sm">{(createOrderMutation.error as Error).message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
