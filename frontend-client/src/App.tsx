import { Link, Outlet } from 'react-router-dom'
import { Toaster } from './shared/ui/toaster'

export default function App() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}
