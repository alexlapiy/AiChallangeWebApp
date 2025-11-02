import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-white font-semibold' : 'text-white/60 hover:text-white'
  }
  
  return (
    <div>
      <nav className="bg-black/50 border-b border-white/10 px-4 py-3">
        <div className="container mx-auto flex gap-6">
          <Link to="/orders" className={isActive('/orders')}>Заказы</Link>
          <Link to="/cities" className={isActive('/cities')}>Города</Link>
          <Link to="/tariffs" className={isActive('/tariffs')}>Тарифы</Link>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

