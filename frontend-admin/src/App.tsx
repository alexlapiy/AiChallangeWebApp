import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, LogOut, Package, MapPin, Coins } from 'lucide-react'
import { Button } from './shared/ui/button'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_id')
    navigate('/login')
  }
  
  const isActive = (path: string) => {
    return location.pathname === path
  }
  
  const navItems = [
    { path: '/orders', label: 'Заказы', icon: Package },
    { path: '/cities', label: 'Города', icon: MapPin },
    { path: '/tariffs', label: 'Тарифы', icon: Coins },
  ]
  
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
              <span className="text-white tracking-wider font-semibold">КИБЕРТРАКС / ADMIN</span>
            </motion.div>
            
            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="flex items-center gap-2">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path)
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                        ${active 
                          ? 'bg-white text-black font-medium' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              {/* Logout */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-20">
        <Outlet />
      </div>
    </div>
  )
}

