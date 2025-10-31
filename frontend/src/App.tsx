import { Link, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/">Оформить заявку</Link>
        <Link to="/orders">Реестр заказов</Link>
        <Link to="/admin/cities">Админ: Города</Link>
        <Link to="/admin/tariffs">Админ: Тарифы</Link>
      </nav>
      <Outlet />
    </div>
  )
}


