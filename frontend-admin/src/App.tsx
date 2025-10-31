import { Link, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/">Города</Link>
        <Link to="/tariffs">Тарифы</Link>
      </nav>
      <Outlet />
    </div>
  )
}

